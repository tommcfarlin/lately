import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/server/supabase';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(req: NextRequest) {
  // Auth check
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

  if (!session || session.user.id !== process.env.LATELY_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  // No file submitted
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Must be a File-like object (duck type to handle VM context differences in tests)
  if (
    typeof file !== 'object' ||
    typeof (file as File).arrayBuffer !== 'function' ||
    typeof (file as File).type !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  const typedFile = file as File;

  // File type check
  if (!ALLOWED_TYPES.includes(typedFile.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${typedFile.type}. Allowed: JPEG, PNG, WebP, HEIC` },
      { status: 415 }
    );
  }

  // File size check
  if (typedFile.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 10MB' },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await typedFile.arrayBuffer());

  // Strip EXIF, apply orientation, convert to JPEG
  const cleaned = await sharp(buffer)
    .rotate() // applies EXIF orientation then strips metadata
    .jpeg({ quality: 85 })
    .toBuffer();

  const filename = `${session.user.id}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('photos')
    .upload(filename, cleaned, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('photos').getPublicUrl(filename);

  return NextResponse.json({
    storage_path: filename,
    public_url: publicUrl,
  });
}
