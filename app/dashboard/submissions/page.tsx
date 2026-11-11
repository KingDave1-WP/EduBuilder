'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Clock, Users, Award, ArrowLeft } from 'lucide-react';

export default function TeacherSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      const isFakeMode = process.env.NEXT_PUBLIC_FAKE_MODE === 'true';

      // Only signed-in teachers can see submissions
      if (!isFakeMode) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }
      }

      const { data, error } = await supabase
        .from('submissions')
        .select('*, activities(title, type)')
        .order('submitted_at', { ascending: false });

      if (error) {
        setError('Could not load submissions. Please refresh and try again.');
      } else if (data) {
        setSubmissions(data);
      }
      setLoading(false);
    }
    fetchSubmissions();
  }, [router]);

  const markAsReviewed = async (id: string) => {
    const { error } = await supabase.from('submissions').update({ status: 'reviewed' }).eq('id', id);

    if (error) {
      setError('Could not mark as reviewed. Please try again.');
      return;
    }

    setError(null);
    setSubmissions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status: 'reviewed' } : sub)));
  };

  // Group submissions by activity title
  const groupedSubmissions: Record<string, any[]> = submissions.reduce((acc, sub) => {
    const activityTitle = sub.activities?.title || 'Unknown Activity';
    if (!acc[activityTitle]) {
      acc[activityTitle] = [];
    }
    acc[activityTitle].push(sub);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading student submissions...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Student Submissions & Marking</h1>
          <p className="text-gray-500 mt-1">
            Review student results, check scores, and mark submissions as reviewed.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {Object.keys(groupedSubmissions).length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">No submissions yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Copy the public share link from your activity builder and share it with your students to start
            collecting results.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSubmissions).map(([activityTitle, subs]) => (
            <div key={activityTitle} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-orange-50/60 px-6 py-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-gray-900">{activityTitle}</h2>
                  <p className="text-xs text-orange-800 font-medium mt-0.5">
                    {subs.length} student {subs.length === 1 ? 'submission' : 'submissions'}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 bg-white border border-orange-200 rounded-full font-semibold text-orange-700">
                  {subs[0]?.activities?.type || 'activity'}
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {subs.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center shrink-0">
                        {sub.student_name ? sub.student_name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{sub.student_name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {new Date(sub.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-extrabold text-orange-600">
                          <Award className="w-4 h-4" /> {sub.score} / {sub.max_score}
                        </div>
                        <span
                          className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.status === 'reviewed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      {sub.status !== 'reviewed' ? (
                        <button
                          onClick={() => markAsReviewed(sub.id)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark Reviewed
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 font-medium px-3 py-2">Reviewed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}