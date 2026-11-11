'use client';
import React, { useState, useEffect } from 'react';
import { OrderContent } from '@/lib/types';
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

export default function PutInOrderTemplate({ 
  content, 
  onSubmitResults 
}: { 
  content: OrderContent; 
  onSubmitResults?: (score: number, maxScore: number, answers: any) => void; 
}) {
  const [items, setItems] = useState<Array<{ id: string; text: string; correctOrder: number }>>([]);
  const [submitted, setSubmitted] = useState(false);

  const rawItems = content?.items || [];

  useEffect(() => {
    setItems([...rawItems].sort(() => Math.random() - 0.5));
  }, [content]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (submitted) return;
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const calculateScore = () => {
    let score = 0;
    items.forEach((item, index) => {
      if (Number(item.correctOrder) === index + 1) score++;
    });
    return score;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onSubmitResults) {
      const score = calculateScore();
      onSubmitResults(score, items.length, items);
    }
  };

  const score = calculateScore();

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
        <p className="text-gray-600 mt-2">{content.instructions}</p>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          let style = "bg-white border-gray-200";
          if (submitted) {
            style = Number(item.correctOrder) === idx + 1 ? "bg-green-50 border-green-500" : "bg-red-50 border-red-400";
          }

          return (
            <div key={item.id || idx} className={`p-4 border rounded-xl flex items-center justify-between shadow-sm transition-all ${style}`}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-sm shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium text-gray-800">{item.text}</span>
              </div>
              {!submitted && (
                <div className="flex gap-1">
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-2 border rounded-lg hover:bg-orange-50 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === items.length - 1}
                    className="p-2 border rounded-lg hover:bg-orange-50 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow hover:bg-orange-700"
        >
          Check Order
        </button>
      ) : (
        <div className="bg-white border-2 border-orange-500 rounded-xl p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold">Result</h2>
          <p className="text-lg">Correctly Positioned: <span className="font-bold text-orange-600">{score}</span> / {items.length}</p>
          <button
            onClick={() => {
              setItems([...rawItems].sort(() => Math.random() - 0.5));
              setSubmitted(false);
            }}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}