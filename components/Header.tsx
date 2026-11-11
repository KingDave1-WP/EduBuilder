'use client';

import Link from 'next/link';
import { BookOpen, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

// Student links look like /a/1794406053866
const STUDENT_ROUTE_PREFIXES = ['/a/'];

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';
  const isStudentView = STUDENT_ROUTE_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  const isDashboard = pathname?.startsWith('/dashboard');
  const hideActions = isLoginPage || isStudentView;

  useEffect(() => {
    const isFakeMode = process.env.NEXT_PUBLIC_FAKE_MODE === 'true';
    if (isFakeMode) {
      setSession({ user: { email: 'teacher@fake.com' } });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push('/login');
    router.refresh();
  };

  const logo = (
    <>
      <BookOpen className="w-6 h-6 text-orange-600" />
      <span>EduBuilder</span>
    </>
  );

  // Signed-in teachers go to the dashboard; everyone else goes to the home page
  const logoHref = session ? '/dashboard' : '/';

  return (
    <header className="bg-white border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Students get a plain logo so they can't click through to the teacher area */}
        {isStudentView ? (
          <div className="flex items-center gap-2 font-extrabold text-xl text-orange-600">{logo}</div>
        ) : (
          <Link href={logoHref} className="flex items-center gap-2 font-extrabold text-xl text-orange-600">
            {logo}
          </Link>
        )}

        {!hideActions && (
          <div className="flex items-center gap-3">
            {!loading && session && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors ${
                  isDashboard
                    ? 'bg-orange-700 text-white'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {!loading &&
              (session ? (
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
              ))}
          </div>
        )}
      </div>
    </header>
  );
}