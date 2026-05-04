import type { LinkData } from '@/lib/types/post';

interface LinkCardProps {
  data: LinkData;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function LinkCard({ data }: LinkCardProps) {
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors group"
    >
      {data.image_url && (
        <img
          src={data.image_url}
          alt={data.title ?? ''}
          className="w-full object-cover max-h-48"
        />
      )}
      <div className="p-3">
        {data.title && (
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:underline line-clamp-2">
            {data.title}
          </p>
        )}
        {data.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
          {hostname(data.url)}
        </p>
      </div>
    </a>
  );
}
