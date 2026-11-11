import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { validateActivityContent } from '@/lib/validator';
import { ActivityContent } from '@/lib/types';

// Only matters if you deploy to Vercel: lets the route run long enough for the AI to answer.
export const maxDuration = 60;

// Tried in order. A 404 (unknown model) or exhausted retries moves on to the next one.
const MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash'];

// Fewer, shorter retries so a busy model doesn't add many seconds of waiting
const MAX_ATTEMPTS_PER_MODEL = 2;
const BASE_BACKOFF_MS = 600;

function getStatus(err: any): number | string | undefined {
  if (typeof err?.status === 'number' || typeof err?.status === 'string') return err.status;
  if (typeof err?.code === 'number') return err.code;

  // The SDK sometimes puts the raw JSON error into err.message
  try {
    const parsed = JSON.parse(err?.message ?? '');
    return parsed?.error?.code ?? parsed?.error?.status;
  } catch {
    return undefined;
  }
}

function isRetryable(err: any): boolean {
  const status = getStatus(err);
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED'
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(ai: GoogleGenAI, systemInstruction: string, userPrompt: string) {
  let lastError: any;

  for (const model of MODELS) {
    // "low" thinking makes Gemini 3 models answer much faster. If a model rejects it, we retry without.
    let useLowThinking = true;

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            ...(useLowThinking ? { thinkingConfig: { thinkingLevel: 'low' as any } } : {}),
          },
        });
      } catch (err: any) {
        lastError = err;
        const status = getStatus(err);

        // Model name not found for this key: skip straight to the next model
        if (status === 404 || status === 'NOT_FOUND') {
          console.warn(`Model ${model} not found, trying next`);
          break;
        }

        // This model doesn't accept the thinking setting: try the same attempt again without it
        if ((status === 400 || status === 'INVALID_ARGUMENT') && useLowThinking) {
          console.warn(`Model ${model} rejected thinkingLevel, retrying without it`);
          useLowThinking = false;
          attempt--;
          continue;
        }

        if (!isRetryable(err)) throw err;

        // Short exponential backoff: 0.6s, 1.2s
        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
      }
    }
  }

  throw lastError;
}

function parseModelJson(rawText: string): ActivityContent {
  // Strip markdown code fences in case the model adds them anyway
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned || '{}');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, type, currentContent } = body;

    const isFakeMode =
      process.env.FAKE_MODE === 'true' || process.env.NEXT_PUBLIC_FAKE_MODE === 'true';
    let generatedJson: ActivityContent;

    if (isFakeMode || !process.env.GEMINI_API_KEY) {
      generatedJson = getMockData(type, prompt);
    } else {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Shorter text means fewer tokens to generate, which is the biggest factor in response time.
      const systemInstruction = `You are an educational activity generator. Return ONLY valid raw JSON matching the standard format for '${type}'. You MUST include a non-empty 'title' string. Do not include markdown code blocks. Keep all text concise: explanations and instructions should be one short sentence each.`;

      const userPrompt = currentContent
        ? `Refine this activity content based on: "${prompt}". Current content JSON: ${JSON.stringify(currentContent)}`
        : `Build a ${type} activity based on: "${prompt}". Ensure you provide a clear, descriptive 'title'.`;

      let response;
      try {
        response = await generateWithRetry(ai, systemInstruction, userPrompt);
      } catch (err: any) {
        const status = getStatus(err);
        console.error('Gemini request failed:', err);

        if (status === 503 || status === 'UNAVAILABLE') {
          return NextResponse.json(
            { error: 'The AI service is busy right now. Please try again in a moment.' },
            { status: 503 }
          );
        }
        if (status === 429 || status === 'RESOURCE_EXHAUSTED') {
          return NextResponse.json(
            { error: 'Too many requests or quota reached. Please wait a bit and try again.' },
            { status: 429 }
          );
        }

        return NextResponse.json(
          {
            error:
              process.env.NODE_ENV === 'development'
                ? `Gemini error (${status ?? 'unknown'}): ${err?.message ?? String(err)}`
                : 'The AI service returned an error. Please try again.',
          },
          { status: 502 }
        );
      }

      try {
        generatedJson = parseModelJson(response.text || '{}');
      } catch {
        return NextResponse.json(
          { error: 'The AI returned an invalid response. Please try again.' },
          { status: 422 }
        );
      }

      if (!generatedJson.title || generatedJson.title.trim() === '') {
        generatedJson.title = prompt
          ? `${prompt} (${String(type).replace('_', ' ')})`
          : `New ${String(type).replace('_', ' ')} Activity`;
      }
    }

    // Validate the generated output
    const validation = validateActivityContent(generatedJson);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    return NextResponse.json({ content: generatedJson });
  } catch (error: any) {
    console.error('Generate route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate activity' },
      { status: 500 }
    );
  }
}

function getMockData(type: string, prompt: string): ActivityContent {
  switch (type) {
    case 'multiple_choice':
      return {
        type: 'multiple_choice',
        title: prompt ? `Quiz: ${prompt}` : 'General Knowledge Quiz',
        instructions: 'Choose the correct answer for each question.',
        questions: [
          {
            id: '1',
            question: 'What process do plants use to make food using light?',
            options: ['Respiration', 'Photosynthesis', 'Fermentation', 'Transpiration'],
            correctIndex: 1,
            explanation: 'Photosynthesis converts light energy into chemical energy.',
          },
        ],
      };
    case 'true_false':
      return {
        type: 'true_false',
        title: prompt ? `True or False: ${prompt}` : 'Science True or False',
        instructions: 'Determine whether each statement is true or false.',
        statements: [
          {
            id: '1',
            statement: 'Chloroplasts give plants their green color.',
            isTrue: true,
            explanation: 'Chlorophyll inside chloroplasts absorbs red and blue light, reflecting green.',
          },
        ],
      };
    default:
      return getMockData('multiple_choice', prompt);
  }
}