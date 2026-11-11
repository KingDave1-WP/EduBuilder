'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityType } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const TYPES: { id: ActivityType; label: string; desc: string }[] = [
  { id: 'multiple_choice', label: 'Multiple Choice', desc: 'Pick one correct answer from 4 options.' },
  { id: 'true_false', label: 'True or False', desc: 'Decide whether a statement is true or false.' },
  { id: 'flashcards', label: 'Flashcards', desc: 'Interactive front-and-back cards for revision.' },
  { id: 'matching', label: 'Matching Pairs', desc: 'Connect terms to their definitions or partners.' },
  { id: 'order', label: 'Put in Order', desc: 'Drag items into the correct sequence.' },
];

export default function CreateActivityPage() {
  const [selectedType, setSelectedType] = useState<ActivityType>('multiple_choice');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Protect the route: verify session on mount
  useEffect(() => {
    async function checkUser() {
      const isFakeMode = process.env.NEXT_PUBLIC_FAKE_MODE === 'true';
      if (isFakeMode) {
        setCheckingAuth(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setCheckingAuth(false);
      }
    }
    checkUser();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: selectedType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate content');

      const id = Date.now().toString();

      // Save to Supabase
      const { error: dbError } = await supabase
        .from('activities')
        .insert([{
          id,
          title: data.content.title,
          type: selectedType,
          content: data.content
        }]);

      if (dbError) throw new Error(dbError.message || 'Failed to save to Supabase');

      router.push(`/builder/${id}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500 font-medium">Verifying educator session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Create New Activity</h1>
        <p className="text-gray-600">Select an activity format and describe your topic.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">1. Select Activity Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TYPES.map(t => (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`p-4 border rounded-xl text-left transition-all ${
                  selectedType === t.id
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-gray-900">{t.label}</div>
                <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">2. What should this activity cover?</label>
          <textarea
            required
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g., Grade 7 photosynthesis, 5 questions, focus on chloroplasts and oxygen output"
            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-base text-gray-800"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating Activity with AI...' : 'Generate Activity'}
        </button>
      </form>
    </div>
  );
}