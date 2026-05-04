import type { MusicData } from '@/lib/types/post';

interface MusicCardProps {
  data: MusicData;
}

export default function MusicCard({ data }: MusicCardProps) {
  if (data.oembed_html) {
    return (
      <div
        className="w-full overflow-hidden rounded-lg [&>iframe]:w-full [&>iframe]:rounded-lg"
        dangerouslySetInnerHTML={{ __html: data.oembed_html }}
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      {data.artwork_url && (
        <img
          src={data.artwork_url}
          alt={data.title ?? 'Album art'}
          className="w-14 h-14 rounded object-cover flex-shrink-0"
        />
      )}
      <div className="min-w-0">
        {data.title && (
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {data.title}
          </p>
        )}
        {data.artist && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{data.artist}</p>
        )}
        {data.album && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{data.album}</p>
        )}
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline mt-0.5 inline-block"
        >
          Open in {data.service === 'apple_music' ? 'Apple Music' : 'Spotify'} →
        </a>
      </div>
    </div>
  );
}
