import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/server/posts';
import PostCard from '@/components/PostCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPostLabel } from '@/lib/utils/labels';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return {};

  const d = post.data as unknown as Record<string, unknown>;
  const name = (d.title ?? d.text ?? d.url ?? '') as string;
  const title = `${getPostLabel(post.type)}${name ? `: ${name}` : ''}`;
  const description = post.caption ?? '';
  const image = (d.cover_url ?? d.thumbnail_url ?? d.image_url ?? d.artwork_url) as
    | string
    | undefined;

  return {
    title: `${title} — ${process.env.LATELY_SITE_TITLE}`,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <>
      <Header />
      <PostCard post={post} />
      <Footer />
    </>
  );
}
