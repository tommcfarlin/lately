import type { VideoData } from '@/lib/types/post';

interface VideoCardProps {
  data: VideoData;
}

export default function VideoCard({ data }: VideoCardProps) {
  if (data.oembed_html) {
    return (
      <div
        className="w-full overflow-hidden rounded-lg aspect-video [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:rounded-lg"
        dangerouslySetInnerHTML={{ __html: data.oembed_html }}
      />
    );
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      {data.thumbnail_url && (
        <img
          src={data.thumbnail_url}
          alt={data.title ?? 'Video thumbnail'}
          className="w-full rounded-lg object-cover aspect-video"
        />
      )}
      {data.title && (
        <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:underline">
          {data.title}
        </p>
      )}
      {data.author && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{data.author}</p>
      )}
    </a>
  );
}
