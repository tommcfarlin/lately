import { NextResponse } from 'next/server';
import { listPosts } from '@/lib/server/posts';
import { generateRss } from '@/lib/utils/rss';

export async function GET() {
  const { posts } = await listPosts({ perPage: 50 });
  const rss = generateRss(
    posts,
    process.env.NEXT_PUBLIC_BASE_URL!,
    process.env.LATELY_SITE_TITLE!,
    process.env.LATELY_SUBTITLE!
  );

  return new NextResponse(rss, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
