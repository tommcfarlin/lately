import type { BookData } from '@/lib/types/post';

interface BookCardProps {
  data: BookData;
}

export default function BookCard({ data }: BookCardProps) {
  const href = data.source_url ?? `https://openlibrary.org/search?q=${encodeURIComponent(data.title)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 group"
    >
      {data.cover_url ? (
        <img
          src={data.cover_url}
          alt={data.title}
          className="w-12 rounded object-cover flex-shrink-0"
          style={{ height: '4.5rem' }}
        />
      ) : (
        <div className="w-12 flex-shrink-0 rounded bg-neutral-100 dark:bg-neutral-800" style={{ height: '4.5rem' }} />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:underline truncate">
          {data.title}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{data.author}</p>
      </div>
    </a>
  );
}
