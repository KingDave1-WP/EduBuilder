'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ActivityRecord, ActivityContent } from '@/lib/types';
import MultipleChoiceTemplate from '@/components/templates/MultipleChoiceTemplate';
import TrueFalseTemplate from '@/components/templates/TrueFalseTemplate';
import FlashcardTemplate from '@/components/templates/FlashcardTemplate';
import MatchingPairsTemplate from '@/components/templates/MatchingPairsTemplate';
import PutInOrderTemplate from '@/components/templates/PutInOrderTemplate';
import { Sparkles, Save, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BuilderPage() {
  const params = useParams();
  const id = params.id as string;

  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [isRawEdit, setIsRawEdit] = useState(false);
  const [refining, setRefining] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadActivity() {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setActivity(data as ActivityRecord);
        setJsonText(JSON.stringify(data.content, null, 2));
      }
    }
    if (id) loadActivity();
  }, [id]);

  const saveActivity = async (updatedContent: ActivityContent) => {
    if (!activity) return;

    const { error } = await supabase
      .from('activities')
      .update({
        content: updatedContent,
        title: updatedContent.title
      })
      .eq('id', id);

    if (!error) {
      setActivity({ ...activity, content: updatedContent, title: updatedContent.title });
      setJsonText(JSON.stringify(updatedContent, null, 2));
    } else {
      setMessage(`Save failed: ${error.message}`);
    }
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activity) return;

    setRefining(true);
    setMessage('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: chatInput,
          type: activity.type,
          currentContent: activity.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refine activity');

      await saveActivity(data.content);
      setChatInput('');
      setMessage('Activity updated successfully!');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setRefining(false);
    }
  };

  const handleJsonSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      await saveActivity(parsed);
      setMessage('Direct JSON edit saved!');
    } catch (err) {
      setMessage('Invalid JSON format. Check syntax before saving.');
    }
  };

  if (!activity) {
    return <div className="p-8 text-center text-gray-500">Loading activity builder...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      <div className="w-full md:w-96 bg-white border-r border-gray-200 p-4 flex flex-col justify-between space-y-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-xl text-gray-900">{activity.title}</h2>
            <a
              href={`/a/${id}`}
              target="_blank"
              className="p-2 text-gray-600 hover:text-orange-600 border rounded-lg hover:bg-orange-50"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex border rounded-lg overflow-hidden p-1 bg-gray-50">
            <button
              onClick={() => setIsRawEdit(false)}
              className={`flex-1 py-1.5 text-xs font-bold rounded ${!isRawEdit ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600'}`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setIsRawEdit(true)}
              className={`flex-1 py-1.5 text-xs font-bold rounded ${isRawEdit ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600'}`}
            >
              Direct Edit (JSON)
            </button>
          </div>

          {message && (
            <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-lg font-medium">
              {message}
            </div>
          )}

          {!isRawEdit ? (
            <form onSubmit={handleRefine} className="space-y-3">
              <label className="block text-xs font-bold uppercase text-gray-500">Refine with AI</label>
              <textarea
                rows={4}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="e.g. 'Make question 2 harder', 'Add 2 more options', 'Fix typos'"
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button
                type="submit"
                disabled={refining}
                className="w-full py-2.5 bg-orange-600 text-white font-bold rounded-xl text-sm hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {refining ? 'Updating Activity...' : 'Apply AI Changes'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-gray-500">Raw JSON Edit</label>
              <textarea
                rows={16}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl bg-gray-900 text-emerald-400 focus:outline-none"
              />
              <button
                onClick={handleJsonSave}
                className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save JSON Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {activity.type === 'multiple_choice' && <MultipleChoiceTemplate content={activity.content as any} />}
        {activity.type === 'true_false' && <TrueFalseTemplate content={activity.content as any} />}
        {activity.type === 'flashcards' && <FlashcardTemplate content={activity.content as any} />}
        {activity.type === 'matching' && <MatchingPairsTemplate content={activity.content as any} />}
        {activity.type === 'order' && <PutInOrderTemplate content={activity.content as any} />}
      </div>
    </div>
  );
}