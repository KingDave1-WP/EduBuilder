'use client';

import Link from 'next/link';
import { BookOpen, LayoutDashboard, Menu, X, Plus, ClipboardList, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

// Student links look like /a/1794406053866
const STUDENT_ROUTE_PREFIXES = ['/a/'];

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close the mobile menu with the Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setSession(null);
    router.push('/login');
    router.refresh();
  };

  const logo = (
    <>
      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 shrink-0" />
      <span>EduBuilder</span>
    </>
  );

  // Signed-in teachers go to the dashboard; everyone else goes to the home page
  const logoHref = session ? '/dashboard' : '/';

  const logoClasses = 'flex items-center gap-2 font-extrabold text-lg sm:text-xl text-orange-600 min-w-0';

  const menuItemClasses =
    'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 active:bg-orange-100 transition-colors text-left';

  return (
    <header className="bg-white border-b border-orange-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Students get a plain logo so they can't click through to the teacher area */}
        {isStudentView ? (
          <div className={logoClasses}>{logo}</div>
        ) : (
          <Link href={logoHref} className={logoClasses}>
            {logo}
          </Link>
        )}

        {!hideActions && !loading && (
          <>
            {session ? (
              <>
                {/* Desktop and tablet: regular buttons */}
                <div className="hidden sm:flex items-center gap-3">
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
                  <button
                    onClick={handleSignOut}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Mobile: hamburger menu */}
                <div className="sm:hidden">
                  <button
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

                  {menuOpen && (
                    <>
                      {/* Tapping anywhere outside the menu closes it */}
                      <button
                        aria-label="Close menu"
                        onClick={() => setMenuOpen(false)}
                        className="fixed inset-0 top-14 z-40 bg-black/20 cursor-default"
                      />

                      <nav className="absolute right-3 top-full mt-2 w-60 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden divide-y divide-gray-100">
                        <Link href="/dashboard" className={menuItemClasses}>
                          <LayoutDashboard className="w-4 h-4 text-orange-600" />
                          Dashboard
                        </Link>
                        <Link href="/create" className={menuItemClasses}>
                          <Plus className="w-4 h-4 text-orange-600" />
                          Create Activity
                        </Link>
                        <Link href="/dashboard/submissions" className={menuItemClasses}>
                          <ClipboardList className="w-4 h-4 text-orange-600" />
                          Student Submissions
                        </Link>
                        <button onClick={handleSignOut} className={`${menuItemClasses} text-gray-600`}>
                          <LogOut className="w-4 h-4 text-gray-500" />
                          Sign Out
                        </button>
                      </nav>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Login
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}