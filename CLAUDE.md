# AI Learning Builder - Option 1 Guidelines

## Core Rules
1. API keys MUST stay on the server. Never expose `GEMINI_API_KEY` to client components.
2. AI-generated text MUST be rendered safely as text node content, never injected via `dangerouslySetInnerHTML`.
3. All core activity formats (multiple_choice, true_false, flashcards, matching, order) must validate against Zod schemas before being saved or shown to the teacher.
4. Fake mode is controlled via `NEXT_PUBLIC_FAKE_MODE=true`.

## Running the Project
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
