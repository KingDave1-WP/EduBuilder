import { ActivityContent } from './types';

export function validateActivityContent(content: ActivityContent): { valid: boolean; error?: string } {
  if (!content.title || content.title.trim() === '') {
    return { valid: false, error: 'Activity title cannot be empty.' };
  }

  switch (content.type) {
    case 'multiple_choice': {
      if (!content.questions || content.questions.length === 0) {
        return { valid: false, error: 'At least 1 question is required.' };
      }
      for (let i = 0; i < content.questions.length; i++) {
        const q = content.questions[i];
        if (q.options.length !== 4) {
          return { valid: false, error: `Question ${i + 1} does not have exactly 4 options.` };
        }
        const uniqueOptions = new Set(q.options.map(o => o.trim().toLowerCase()));
        if (uniqueOptions.size !== q.options.length) {
          return { valid: false, error: `Question ${i + 1} contains duplicate answer options.` };
        }
        if (q.correctIndex < 0 || q.correctIndex > 3) {
          return { valid: false, error: `Question ${i + 1} has an invalid correct answer index.` };
        }
      }
      break;
    }
    case 'true_false': {
      if (!content.statements || content.statements.length === 0) {
        return { valid: false, error: 'At least 1 statement is required.' };
      }
      break;
    }
    case 'flashcards': {
      if (!content.cards || content.cards.length === 0) {
        return { valid: false, error: 'At least 1 card is required.' };
      }
      break;
    }
    case 'matching': {
      if (!content.pairs || content.pairs.length < 2) {
        return { valid: false, error: 'Matching activities require at least 2 pairs.' };
      }
      break;
    }
    case 'order': {
      if (!content.items || content.items.length < 2) {
        return { valid: false, error: 'Ordering activities require at least 2 items.' };
      }
      break;
    }
  }

  return { valid: true };
}
