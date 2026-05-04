import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { listPosts } from '@/lib/server/posts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeedPage from '@/components/FeedPage';

export default async function HomePage() {
  const { posts, total } = await listPosts({ page: 1 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const isOwner = session?.user.id === process.env.LATELY_USER_ID;

  return (
    <>
      <Header />
      <FeedPage
        initialPosts={posts}
        initialTotal={total}
        isOwner={isOwner}
      />
      <Footer />
    </>
  );
}
