'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ActivityCard from '@/components/ActivityCard';
import { ActivityRecord } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Plus, FileText, Users, Clock, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [toReviewCount, setToReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete flow
  const [pendingDelete, setPendingDelete] = useState<ActivityRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      const isFakeMode = process.env.NEXT_PUBLIC_FAKE_MODE === 'true';

      // Only signed-in teachers can see the dashboard
      let userId: string | null = null;
      if (!isFakeMode) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }
        userId = session.user.id;
      }

      setLoading(true);
      setError(null);

      // Each teacher only sees the activities they created
      let activitiesQuery = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      if (userId) {
        activitiesQuery = activitiesQuery.eq('user_id', userId);
      }

      const [actRes, totalRes, pendingRes] = await Promise.all([
        activitiesQuery,
        supabase.from('submissions').select('*', { count: 'exact', head: true }),
        supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'reviewed'),
      ]);

      if (actRes.error) {
        setError('Could not load your activities. Please refresh and try again.');
      } else if (actRes.data) {
        setActivities(actRes.data as ActivityRecord[]);
      }

      if (totalRes.count !== null) setSubmissionCount(totalRes.count);
      if (pendingRes.count !== null) setToReviewCount(pendingRes.count);

      setLoading(false);
    }

    fetchDashboardData();
  }, [router]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);

    // .select() makes Supabase return the deleted rows, so we can tell
    // when a Row Level Security policy silently blocked the delete.
    const { data, error } = await supabase
      .from('activities')
      .delete()
      .eq('id', pendingDelete.id)
      .select();

    if (error) {
      setDeleteError(
        error.code === '23503'
          ? 'This activity has student submissions, so it can’t be deleted yet.'
          : `Could not delete: ${error.message}`
      );
      setDeleting(false);
      return;
    }

    if (!data || data.length === 0) {
      setDeleteError('Nothing was deleted. Check that your Supabase delete policy allows this.');
      setDeleting(false);
      return;
    }

    setActivities((prev) => prev.filter((a) => a.id !== pendingDelete.id));
    setPendingDelete(null);
    setDeleting(false);
  };

  const closeModal = () => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage interactive materials and view student results.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/submissions"
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ClipboardList className="w-5 h-5 text-gray-600" />
            <span>Student Submissions</span>
            {toReviewCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded-full">
                {toReviewCount}
              </span>
            )}
          </Link>

          <Link
            href="/create"
            className="px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Activity</span>
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{activities.length}</p>
              <p className="text-xs text-gray-500 font-medium">Activities created</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{submissionCount}</p>
              <p className="text-xs text-gray-500 font-medium">Student submissions</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{toReviewCount}</p>
              <p className="text-xs text-gray-500 font-medium">Waiting for review</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 font-medium">Loading your dashboard...</div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-medium">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl space-y-3">
          <p className="text-gray-500">You haven&apos;t created any activities yet.</p>
          <div>
            <Link
              href="/create"
              className="inline-block px-4 py-2 bg-orange-100 text-orange-800 font-semibold rounded-lg hover:bg-orange-200 transition-colors"
            >
              Create Your First Activity
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Your activities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                <ActivityCard activity={act} />

                {/* Delete button, top-right of each card */}
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setPendingDelete(act);
                  }}
                  aria-label={`Delete ${act.title ?? 'activity'}`}
                  title="Delete activity"
                  className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/90 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete this activity?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">{pendingDelete.title ?? 'This activity'}</span> will be
                  permanently deleted, and its student link will stop working. This can&apos;t be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeModal}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}