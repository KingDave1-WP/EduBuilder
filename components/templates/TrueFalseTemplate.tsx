'use client';
import React, { useState } from 'react';
import { TrueFalseContent } from '@/lib/types';
import { Check, X, RotateCcw } from 'lucide-react';

export default function TrueFalseTemplate({ 
  content, 
  onSubmitResults 
}: { 
  content: TrueFalseContent; 
  onSubmitResults?: (score: number, maxScore: number, answers: any) => void; 
}) {
  const [userAnswers, setUserAnswers] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // Support questions, statements, or items interchangeably
  const statements = (content as any)?.questions || content?.statements || (content as any)?.items || [];

  const handleSelect = (idx: number, val: boolean) => {
    if (submitted) return;
    setUserAnswers(prev => ({ ...prev, [idx]: val }));
  };

  const calculateScore = () => {
    let s = 0;
    statements.forEach((stmt: any, idx: number) => {
      const userAns = userAnswers[idx];
      // Check is_true, isTrue, answer, or correct keys
      let correctVal = stmt.is_true !== undefined ? stmt.is_true : 
                       (stmt.isTrue !== undefined ? stmt.isTrue : 
                       (stmt.answer !== undefined ? stmt.answer : stmt.correct));
      
      if (typeof correctVal === 'string') {
        correctVal = correctVal.toLowerCase() === 'true';
      }

      if (userAns === correctVal) {
        s++;
      }
    });
    return s;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onSubmitResults) {
      const finalScore = calculateScore();
      onSubmitResults(finalScore, statements.length, userAnswers);
    }
  };

  const currentScore = calculateScore();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{content?.title || 'True or False Activity'}</h1>
        <p className="text-gray-600 mt-2">{content?.instructions || 'Determine whether each statement is true or false.'}</p>
      </div>

      {statements.map((stmt: any, idx: number) => {
        const stmtText = stmt.statement || stmt.question || stmt.text;
        let correctVal = stmt.is_true !== undefined ? stmt.is_true : 
                         (stmt.isTrue !== undefined ? stmt.isTrue : 
                         (stmt.answer !== undefined ? stmt.answer : stmt.correct));
        if (typeof correctVal === 'string') {
          correctVal = correctVal.toLowerCase() === 'true';
        }

        return (
          <div key={stmt.id || idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <p className="font-semibold text-lg text-gray-800">{idx + 1}. {stmtText}</p>
            <div className="grid grid-cols-2 gap-3">
              {[true, false].map((val) => {
                const isSelected = userAnswers[idx] === val;
                let style = "border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50";

                if (isSelected) style = "border-orange-500 bg-orange-100 text-orange-900 font-bold";

                if (submitted) {
                  if (correctVal === val) {
                    style = "border-green-500 bg-green-50 text-green-900 font-bold";
                  } else if (isSelected) {
                    style = "border-red-500 bg-red-50 text-red-900";
                  }
                }

                return (
                  <button
                    key={String(val)}
                    onClick={() => handleSelect(idx, val)}
                    className={`py-3 px-4 border rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${style}`}
                  >
                    {val ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {val ? "True" : "False"}
                  </button>
                );
              })}
            </div>
            {submitted && stmt.explanation && (
              <p className="text-sm text-gray-600 bg-gray-50 border-l-4 border-orange-500 p-2.5 rounded">
                <span className="font-semibold">Explanation:</span> {stmt.explanation}
              </p>
            )}
          </div>
        );
      })}

      {statements.length > 0 && (!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(userAnswers).length < statements.length}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          Check Statements
        </button>
      ) : (
        <div className="bg-white border-2 border-orange-500 rounded-xl p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold">Finished! 🎉</h2>
          <p className="text-xl">Score: <span className="font-extrabold text-orange-600">{currentScore}</span> / {statements.length}</p>
          <button
            onClick={() => { setUserAnswers({}); setSubmitted(false); }}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      ))}
    </div>
  );
}