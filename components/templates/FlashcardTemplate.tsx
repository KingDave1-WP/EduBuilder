'use client';
import React, { useState } from 'react';
import { FlashcardsContent } from '@/lib/types';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle } from 'lucide-react';

export default function FlashcardTemplate({ 
  content, 
  onSubmitResults 
}: { 
  content: FlashcardsContent; 
  onSubmitResults?: (score: number, maxScore: number, answers: any) => void; 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const rawCards = content?.cards || (content as any)?.items || (content as any)?.pairs || [];
  const cards = rawCards.map((c: any) => ({
    front: c.front || c.question || c.term,
    back: c.back || c.answer || c.definition
  }));

  const card = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setReviewedCards(prev => ({ ...prev, [currentIndex]: true }));
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const totalReviewed = Object.keys(reviewedCards).length || cards.length;
    if (onSubmitResults) {
      onSubmitResults(totalReviewed, cards.length, { reviewedCount: totalReviewed });
    }
  };

  if (!cards.length) {
    return <div className="p-8 text-center text-gray-500">No flashcards available.</div>;
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white border-2 border-orange-500 rounded-xl shadow-sm text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Study Session Complete! 🎉</h2>
        <p className="text-gray-600">You reviewed all <strong className="text-gray-900">{cards.length}</strong> flashcards.</p>
        <button
          onClick={() => { setSubmitted(false); setCurrentIndex(0); setReviewedCards({}); }}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg inline-flex items-center gap-2 hover:bg-gray-800"
        >
          <RotateCcw className="w-4 h-4" /> Study Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{content?.title || 'Flashcards'}</h1>
        <p className="text-gray-600 mt-2">{content?.instructions || 'Flip through the cards to study key concepts.'}</p>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 font-medium px-1">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <span className="text-orange-600">{Object.keys(reviewedCards).length} reviewed</span>
      </div>

      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer min-h-[260px] bg-white border-2 border-orange-300 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center text-center relative group"
      >
        <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">
          {isFlipped ? "Back (Answer)" : "Front (Question)"}
        </span>
        <p className="text-xl font-medium text-gray-800 leading-relaxed">
          {isFlipped ? card.back : card.front}
        </p>
        <p className="text-xs text-gray-400 mt-6 group-hover:text-orange-500 transition-colors">
          Click to flip card
        </p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <button
          onClick={handlePrev}
          className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" /> Previous
        </button>
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="py-3 px-4 bg-orange-100 text-orange-800 rounded-xl font-medium hover:bg-orange-200"
        >
          Flip
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 flex items-center justify-center gap-2"
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {currentIndex === cards.length - 1 && (
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" /> Finish & Submit Deck
        </button>
      )}
    </div>
  );
}