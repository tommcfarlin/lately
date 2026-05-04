import type { MovieData } from '@/lib/types/post';

interface MovieCardProps {
  data: MovieData;
}

export default function MovieCard({ data }: MovieCardProps) {
  return (
    <a
      href={data.tmdb_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 group"
    >
      {data.cover_url ? (
        <img
          src={data.cover_url}
          alt={data.title}
          className="w-12 h-18 rounded object-cover flex-shrink-0"
          style={{ height: '4.5rem' }}
        />
      ) : (
        <div className="w-12 flex-shrink-0 rounded bg-neutral-100 dark:bg-neutral-800" style={{ height: '4.5rem' }} />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:underline">
          {data.title}
        </p>
        {data.year && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{data.year}</p>
        )}
      </div>
    </a>
  );
}
