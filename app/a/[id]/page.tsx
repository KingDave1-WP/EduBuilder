'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ActivityRecord } from '@/lib/types';
import MultipleChoiceTemplate from '@/components/templates/MultipleChoiceTemplate';
import TrueFalseTemplate from '@/components/templates/TrueFalseTemplate';
import FlashcardTemplate from '@/components/templates/FlashcardTemplate';
import MatchingPairsTemplate from '@/components/templates/MatchingPairsTemplate';
import PutInOrderTemplate from '@/components/templates/PutInOrderTemplate';
import { supabase } from '@/lib/supabase';

type SaveState = 'saving' | 'saved' | 'error';

type SubmissionPayload = {
  activity_id: string;
  student_name: string;
  score: number;
  max_score: number;
  answers: any;
  status: string;
  submitted_at: string;
};

// Pick the heading and message based on how well the student did
function getFeedback(score: number, max: number) {
  const percent = max > 0 ? (score / max) * 100 : 0;

  if (percent >= 80) return { title: 'Activity Finished! 🎉', message: 'Great job' };
  if (percent >= 50) return { title: 'Activity Finished!', message: 'Well done' };
  return { title: 'Activity Finished', message: 'Keep practising' };
}

export default function PublicStudentPage() {
  const params = useParams();
  const id = params.id as string;
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Student identity and completion states
  const [studentName, setStudentName] = useState('');
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<{ score: number; max: number } | null>(null);

  // Saving the result to Supabase
  const [saveState, setSaveState] = useState<SaveState>('saving');
  const [pendingSubmission, setPendingSubmission] = useState<SubmissionPayload | null>(null);

  useEffect(() => {
    async function fetchPublicActivity() {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setActivity(data as ActivityRecord);
      }
      setLoading(false);
    }
    if (id) fetchPublicActivity();
  }, [id]);

  const saveSubmission = async (payload: SubmissionPayload) => {
    setSaveState('saving');

    const { error } = await supabase.from('submissions').insert([payload]);

    if (error) {
      console.error('Failed to save submission:', error);
      setSaveState('error');
      return;
    }
    setSaveState('saved');
  };

  const handleCompleteActivity = async (score: number, maxScore: number, answers: any) => {
    if (submitted) return; // ignore accidental double submits

    const payload: SubmissionPayload = {
      activity_id: id,
      student_name: studentName.trim(),
      score,
      max_score: maxScore,
      answers,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    setFinalScore({ score, max: maxScore });
    setSubmitted(true);
    setPendingSubmission(payload);

    // Save submission to Supabase so the teacher can view it in their dashboard
    await saveSubmission(payload);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading activity...</div>;
  }

  if (!activity) {
    return (
      <div className="max-w-md mx-4 sm:mx-auto my-10 sm:my-20 p-6 text-center bg-white rounded-xl shadow-sm border">
        <h2 className="text-xl font-bold text-gray-800">Activity Not Found</h2>
        <p className="text-sm text-gray-500 mt-2">Check the link or ask your teacher for an updated link.</p>
      </div>
    );
  }

  // 1. Ask for student name before starting
  if (!started) {
    return (
      <div className="max-w-md mx-4 sm:mx-auto mt-10 sm:mt-20 p-6 bg-white border rounded-xl shadow-sm space-y-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">{activity.title}</h1>
        <p className="text-sm text-gray-600">Please enter your full name before starting the activity:</p>
        <input
          type="text"
          placeholder="e.g. Jane Doe"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <button
          disabled={!studentName.trim()}
          onClick={() => setStarted(true)}
          className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          Start Activity
        </button>
      </div>
    );
  }

  // 2. Show score screen when finished
  if (submitted && finalScore) {
    const feedback = getFeedback(finalScore.score, finalScore.max);

    return (
      <div className="max-w-md mx-4 sm:mx-auto mt-10 sm:mt-20 p-6 sm:p-8 bg-white border-2 border-orange-500 rounded-xl shadow-sm text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">{feedback.title}</h2>
        <p className="text-gray-600">
          {feedback.message}, <strong className="text-gray-900">{studentName}</strong>!
        </p>
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-gray-500">Your Final Score</p>
          <p className="text-3xl font-extrabold text-orange-600 mt-1">
            {finalScore.score} / {finalScore.max}
          </p>
        </div>

        {saveState === 'saving' && (
          <p className="text-xs text-gray-400">Sending your results to your teacher...</p>
        )}
        {saveState === 'saved' && (
          <p className="text-xs text-gray-400">Your results have been successfully sent to your teacher.</p>
        )}
        {saveState === 'error' && (
          <div className="space-y-2">
            <p className="text-xs text-red-600">
              We couldn&apos;t send your results to your teacher. Please try again.
            </p>
            <button
              onClick={() => pendingSubmission && saveSubmission(pendingSubmission)}
              className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. Render the respective activity template with submission callback
  return (
    <div className="py-6 px-2 min-h-screen bg-orange-50/40">
      <div className="max-w-2xl mx-auto mb-4 bg-white p-3 rounded-lg border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm text-gray-600 shadow-sm">
        <span>
          Student: <strong className="text-gray-900">{studentName}</strong>
        </span>
        <span>
          Activity: <strong className="text-gray-900">{activity.title}</strong>
        </span>
      </div>

      {activity.type === 'multiple_choice' && (
        <MultipleChoiceTemplate
          content={activity.content as any}
          onSubmitResults={(score, max, answers) => handleCompleteActivity(score, max, answers)}
        />
      )}
      {activity.type === 'true_false' && (
        <TrueFalseTemplate
          content={activity.content as any}
          onSubmitResults={(score, max, answers) => handleCompleteActivity(score, max, answers)}
        />
      )}
      {activity.type === 'flashcards' && <FlashcardTemplate content={activity.content as any} />}
      {activity.type === 'matching' && (
        <MatchingPairsTemplate
          content={activity.content as any}
          onSubmitResults={(score, max, answers) => handleCompleteActivity(score, max, answers)}
        />
      )}
      {activity.type === 'order' && (
        <PutInOrderTemplate
          content={activity.content as any}
          onSubmitResults={(score, max, answers) => handleCompleteActivity(score, max, answers)}
        />
      )}
    </div>
  );
}