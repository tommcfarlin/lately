import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createPost, updatePost, deletePost, listPosts } from '@/lib/server/posts';

async function getOwnerSession() {
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
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  if (session.user.id !== process.env.LATELY_USER_ID) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const perPage = parseInt(searchParams.get('perPage') ?? '20');
  const { posts, total } = await listPosts({ page, perPage });
  return NextResponse.json({ posts, total });
}

export async function POST(req: NextRequest) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (!body.type || !body.data) {
    return NextResponse.json({ error: 'Missing required fields: type, data' }, { status: 400 });
  }

  const post = await createPost(session.user.id, {
    type: body.type,
    caption: body.caption ?? null,
    data: body.data,
  });

  return NextResponse.json(post, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const post = await updatePost(id, updates);
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest) {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await deletePost(id);
  return NextResponse.json({ ok: true });
}
