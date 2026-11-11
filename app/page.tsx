import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-medium text-sm">
        <Sparkles className="w-4 h-4" /> AI-Powered Activity Generator for Teachers
      </div>
      
      <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight">
        Create interactive learning activities in <span className="text-orange-600">seconds</span>.
      </h1>

      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Turn your lesson notes or topics into interactive quizzes, flashcards, matching games, and ordering exercises for your classroom.
      </p>

      <div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-orange-700 transition-all hover:scale-105"
        >
          Build an Activity Now <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
        <div className="p-6 bg-white border border-orange-100 rounded-xl shadow-sm">
          <Zap className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-bold text-lg mb-1">Instant Generation</h3>
          <p className="text-sm text-gray-600">Type a short topic or paste notes to generate interactive activities instantly.</p>
        </div>
        <div className="p-6 bg-white border border-orange-100 rounded-xl shadow-sm">
          <ShieldCheck className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-bold text-lg mb-1">5 Core Templates</h3>
          <p className="text-sm text-gray-600">Multiple choice, true/false, flashcards, matching pairs, and sequence ordering.</p>
        </div>
        <div className="p-6 bg-white border border-orange-100 rounded-xl shadow-sm">
          <Sparkles className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-bold text-lg mb-1">Student Friendly</h3>
          <p className="text-sm text-gray-600">Students open a simple share link on mobile devices with zero logins needed.</p>
        </div>
      </div>
    </div>
  );
}
