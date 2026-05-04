import type { SocialData } from '@/lib/types/post';

interface SocialCardProps {
  data: SocialData;
}

export default function SocialCard({ data }: SocialCardProps) {
  if (data.oembed_html) {
    return (
      <div
        className="w-full [&>blockquote]:!m-0"
        dangerouslySetInnerHTML={{ __html: data.oembed_html }}
      />
    );
  }

  // OG fallback
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-500 hover:underline break-all"
    >
      {data.url}
    </a>
  );
}
