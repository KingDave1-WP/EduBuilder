import Link from 'next/link';
import { ExternalLink, Edit3 } from 'lucide-react';

export default function ActivityCard({ activity }: { activity: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-orange-300 transition-all flex flex-col justify-between">
      <div>
        <span className="inline-block px-2.5 py-1 text-xs font-semibold uppercase bg-orange-100 text-orange-800 rounded-full mb-3">
          {activity.type.replace('_', ' ')}
        </span>
        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{activity.title}</h3>
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <Link
          href={`/builder/${activity.id}`}
          className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
        >
          <Edit3 className="w-4 h-4" /> Edit
        </Link>
        <Link
          href={`/a/${activity.id}`}
          target="_blank"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" /> Share
        </Link>
      </div>
    </div>
  );
}
