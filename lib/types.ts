export type ActivityType = 
  | 'multiple_choice'
  | 'true_false'
  | 'flashcards'
  | 'matching'
  | 'order';

export interface MultipleChoiceContent {
  type: 'multiple_choice';
  title: string;
  instructions: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface TrueFalseContent {
  type: 'true_false';
  title: string;
  instructions: string;
  statements: Array<{
    id: string;
    statement: string;
    isTrue: boolean;
    explanation: string;
  }>;
}

export interface FlashcardsContent {
  type: 'flashcards';
  title: string;
  instructions: string;
  cards: Array<{
    id: string;
    front: string;
    back: string;
  }>;
}

export interface MatchingContent {
  type: 'matching';
  title: string;
  instructions: string;
  pairs: Array<{
    id: string;
    left: string;
    right: string;
  }>;
}

export interface OrderContent {
  type: 'order';
  title: string;
  instructions: string;
  items: Array<{
    id: string;
    text: string;
    correctOrder: number;
  }>;
}

export type ActivityContent = 
  | MultipleChoiceContent 
  | TrueFalseContent 
  | FlashcardsContent 
  | MatchingContent 
  | OrderContent;

export interface ActivityRecord {
  id: string;
  user_id?: string;
  title: string;
  type: ActivityType;
  content: ActivityContent;
  created_at?: string;
}
