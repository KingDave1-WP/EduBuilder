'use client';
import React, { useState } from 'react';
import { MultipleChoiceContent } from '@/lib/types';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

export default function MultipleChoiceTemplate({ 
  content, 
  onSubmitResults 
}: { 
  content: MultipleChoiceContent; 
  onSubmitResults?: (score: number, maxScore: number, answers: any) => void; 
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = content?.questions || (content as any)?.items || [];

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q: any, idx: number) => {
      const userChoiceIndex = selectedAnswers[idx];
      const userChoiceText = userChoiceIndex !== undefined ? q.options[userChoiceIndex] : null;

      // Check all possible property name variations for the correct answer index
      const correctIndexVal = 
        q.correct_index !== undefined ? Number(q.correct_index) : 
        (q.correctIndex !== undefined ? Number(q.correctIndex) : 
        (q.answer_index !== undefined ? Number(q.answer_index) : 
        (q.answerIndex !== undefined ? Number(q.answerIndex) : -1)));

      const correctTextVal = q.correct_answer || q.correctAnswer || q.answer || q.correct;

      const isCorrect = 
        (userChoiceIndex !== undefined && userChoiceIndex === correctIndexVal) ||
        (userChoiceText && correctTextVal && userChoiceText.trim().toLowerCase() === String(correctTextVal).trim().toLowerCase());

      if (isCorrect) score++;
    });
    return score;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onSubmitResults) {
      const finalScore = calculateScore();
      onSubmitResults(finalScore, questions.length, selectedAnswers);
    }
  };

  const score = calculateScore();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{content?.title || 'Multiple Choice Quiz'}</h1>
        <p className="text-gray-600 mt-2">{content?.instructions || 'Select the correct option for each question.'}</p>
      </div>

      {questions.map((q: any, qIdx: number) => {
        const correctIndexVal = 
          q.correct_index !== undefined ? Number(q.correct_index) : 
          (q.correctIndex !== undefined ? Number(q.correctIndex) : 
          (q.answer_index !== undefined ? Number(q.answer_index) : 
          (q.answerIndex !== undefined ? Number(q.answerIndex) : -1)));

        const correctTextVal = q.correct_answer || q.correctAnswer || q.answer || q.correct;

        return (
          <div key={q.id || qIdx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">
              {qIdx + 1}. {q.question || q.statement}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt: string, oIdx: number) => {
                let btnStyle = "border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300";
                
                if (selectedAnswers[qIdx] === oIdx) {
                  btnStyle = "border-orange-500 bg-orange-100 text-orange-900 font-medium";
                }

                const isThisCorrect = oIdx === correctIndexVal || (correctTextVal && opt.trim().toLowerCase() === String(correctTextVal).trim().toLowerCase());

                if (submitted) {
                  if (isThisCorrect) {
                    btnStyle = "border-green-500 bg-green-50 text-green-900 font-medium";
                  } else if (selectedAnswers[qIdx] === oIdx) {
                    btnStyle = "border-red-500 bg-red-50 text-red-900";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(qIdx, oIdx)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all text-base flex justify-between items-center ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {submitted && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                    {submitted && selectedAnswers[qIdx] === oIdx && !isThisCorrect && (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div className="bg-gray-50 border-l-4 border-orange-500 p-3 rounded text-sm text-gray-600 mt-2">
                <span className="font-semibold text-gray-800">Explanation:</span> {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(selectedAnswers).length < questions.length}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answers
        </button>
      ) : (
        <div className="bg-white border-2 border-orange-500 rounded-xl p-6 text-center space-y-4 shadow-lg">
          <h2 className="text-2xl font-extrabold text-gray-900">Activity Complete! 🎉</h2>
          <p className="text-lg text-gray-700">
            You scored <span className="font-bold text-orange-600 text-2xl">{score}</span> / {questions.length}
          </p>
          <button
            onClick={() => {
              setSelectedAnswers({});
              setSubmitted(false);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}