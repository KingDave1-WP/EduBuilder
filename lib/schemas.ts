import { z } from 'zod';

export const MultipleChoiceSchema = z.object({
  type: z.literal('multiple_choice'),
  title: z.string().min(1),
  instructions: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string().min(1),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string()
  })).min(1).max(20)
});

export const TrueFalseSchema = z.object({
  type: z.literal('true_false'),
  title: z.string().min(1),
  instructions: z.string(),
  statements: z.array(z.object({
    id: z.string(),
    statement: z.string().min(1),
    isTrue: z.boolean(),
    explanation: z.string()
  })).min(1).max(20)
});

export const FlashcardsSchema = z.object({
  type: z.literal('flashcards'),
  title: z.string().min(1),
  instructions: z.string(),
  cards: z.array(z.object({
    id: z.string(),
    front: z.string().min(1),
    back: z.string().min(1)
  })).min(1).max(30)
});

export const MatchingSchema = z.object({
  type: z.literal('matching'),
  title: z.string().min(1),
  instructions: z.string(),
  pairs: z.array(z.object({
    id: z.string(),
    left: z.string().min(1),
    right: z.string().min(1)
  })).min(2).max(15)
});

export const OrderSchema = z.object({
  type: z.literal('order'),
  title: z.string().min(1),
  instructions: z.string(),
  items: z.array(z.object({
    id: z.string(),
    text: z.string().min(1),
    correctOrder: z.number()
  })).min(2).max(15)
});

export const ActivityContentSchema = z.discriminatedUnion('type', [
  MultipleChoiceSchema,
  TrueFalseSchema,
  FlashcardsSchema,
  MatchingSchema,
  OrderSchema
]);
