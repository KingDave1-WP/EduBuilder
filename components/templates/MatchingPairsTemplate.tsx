'use client';
import React, { useState, useEffect } from 'react';
import { MatchingContent } from '@/lib/types';
import { RotateCcw } from 'lucide-react';

export default function MatchingPairsTemplate({ 
  content, 
  onSubmitResults 
}: { 
  content: MatchingContent; 
  onSubmitResults?: (score: number, maxScore: number, answers: any) => void; 
}) {
  const [shuffledRights, setShuffledRights] = useState<{ id: string; right: string }[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const rawPairs = content?.pairs || (content as any)?.items || (content as any)?.matches || [];
  const pairs = rawPairs.map((p: any, idx: number) => ({
    id: String(p.id || idx),
    left: p.left || p.term || p.question,
    right: p.right || p.definition || p.answer
  }));

  useEffect(() => {
    const rights = pairs.map((p: any) => ({ id: p.id, right: p.right }));
    setShuffledRights([...rights].sort(() => Math.random() - 0.5));
  }, [content]);

  const handleLeftClick = (id: string) => {
    if (submitted) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (rightText: string) => {
    if (submitted || !selectedLeft) return;
    setMatches(prev => ({ ...prev, [selectedLeft]: rightText }));
    setSelectedLeft(null);
  };

  const calculateScore = () => {
    return Object.entries(matches).reduce((acc, [leftId, rightVal]) => {
      const pair = pairs.find((p: any) => String(p.id) === String(leftId));
      return pair && pair.right.trim().toLowerCase() === rightVal.trim().toLowerCase() ? acc + 1 : acc;
    }, 0);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onSubmitResults) {
      const score = calculateScore();
      onSubmitResults(score, pairs.length, matches);
    }
  };

  const score = calculateScore();

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{content?.title || 'Matching Activity'}</h1>
        <p className="text-gray-600 mt-2">{content?.instructions || 'Match each term with its correct definition.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 text-center">Terms</h3>
          {pairs.map((pair: any) => {
            const isSelected = selectedLeft === pair.id;
            const isMatched = !!matches[pair.id];
            return (
              <button
                key={pair.id}
                onClick={() => handleLeftClick(pair.id)}
                className={`w-full p-4 rounded-xl border text-left font-medium transition-all ${
                  isSelected ? 'border-orange-500 bg-orange-100 ring-2 ring-orange-400' :
                  isMatched ? 'border-emerald-400 bg-emerald-50 text-emerald-900' :
                  'border-gray-200 bg-white hover:bg-orange-50'
                }`}
              >
                {pair.left}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 text-center">Matches</h3>
          {shuffledRights.map((item, idx) => {
            const isTarget = Object.values(matches).includes(item.right);
            return (
              <button
                key={idx}
                onClick={() => handleRightClick(item.right)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isTarget ? 'border-emerald-400 bg-emerald-50 text-emerald-900' :
                  selectedLeft ? 'border-orange-300 bg-white hover:bg-orange-50 cursor-pointer' :
                  'border-gray-200 bg-white cursor-default'
                }`}
              >
                {item.right}
              </button>
            );
          })}
        </div>
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length < pairs.length}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow hover:bg-orange-700 disabled:opacity-50"
        >
          Check Matches
        </button>
      ) : (
        <div className="bg-white border-2 border-orange-500 rounded-xl p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold">Result</h2>
          <p className="text-xl">Matched: <span className="font-bold text-orange-600">{score}</span> / {pairs.length}</p>
          <button
            onClick={() => { setMatches({}); setSubmitted(false); setSelectedLeft(null); }}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      )}
    </div>
  );
}