import type { Post } from '@/lib/types/post';
import { getPostLabel } from './labels';

function postTitle(post: Post): string {
  const label = getPostLabel(post.type);
  const d = post.data as Record<string, unknown>;
  const name = (d.title ?? d.text ?? d.url ?? '') as string;
  return name ? `${label}: ${name}` : label;
}

function postDescription(post: Post): string {
  const parts: string[] = [];
  if (post.caption) parts.push(post.caption);
  const d = post.data as Record<string, unknown>;
  if (d.author) parts.push(`by ${d.author}`);
  if (d.artist) parts.push(`by ${d.artist}`);
  if (d.attribution) parts.push(`— ${d.attribution}`);
  if (d.source) parts.push(`(${d.source})`);
  return parts.join(' ');
}

export function generateRss(
  posts: Post[],
  baseUrl: string,
  siteTitle: string,
  subtitle: string
): string {
  const items = posts
    .map(
      (post) => `
    <item>
      <title>${escapeXml(postTitle(post))}</title>
      <description>${escapeXml(postDescription(post))}</description>
      <link>${baseUrl}/post/${post.id}</link>
      <guid>${baseUrl}/post/${post.id}</guid>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(subtitle)}</description>
    <link>${baseUrl}</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
