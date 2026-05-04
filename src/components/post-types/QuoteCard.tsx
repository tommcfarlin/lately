import type { QuoteData } from '@/lib/types/post';

interface QuoteCardProps {
  data: QuoteData;
}

export default function QuoteCard({ data }: QuoteCardProps) {
  return (
    <blockquote className="border-l-2 border-neutral-200 dark:border-neutral-700 pl-4">
      <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">
        {data.text}
      </p>
      {(data.attribution || data.source) && (
        <footer className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {data.attribution && <span>{data.attribution}</span>}
          {data.attribution && data.source && <span>, </span>}
          {data.source && (
            data.source_url ? (
              <a
                href={data.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="italic hover:underline"
              >
                {data.source}
              </a>
            ) : (
              <span className="italic">{data.source}</span>
            )
          )}
        </footer>
      )}
    </blockquote>
  );
}
