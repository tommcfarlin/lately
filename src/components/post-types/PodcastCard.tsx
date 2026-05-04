import type { PodcastData } from '@/lib/types/post';

interface PodcastCardProps {
  data: PodcastData;
}

export default function PodcastCard({ data }: PodcastCardProps) {
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 group"
    >
      {data.artwork_url ? (
        <img
          src={data.artwork_url}
          alt={data.show ?? 'Podcast artwork'}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      )}
      <div className="min-w-0">
        {data.title && (
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:underline line-clamp-2">
            {data.title}
          </p>
        )}
        {data.show && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{data.show}</p>
        )}
      </div>
    </a>
  );
}
