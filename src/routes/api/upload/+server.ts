// src/routes/api/upload/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sharp from 'sharp';
import { supabaseAdmin } from '$lib/server/supabase';

async function getAuthenticatedUserId(cookies: any): Promise<string> {
  const accessToken = cookies.get('sb-access-token');
  if (!accessToken) throw error(401, 'Unauthorized');

  const { data, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !data.user) throw error(401, 'Unauthorized');

  return data.user.id;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const userId = await getAuthenticatedUserId(cookies);

  const formData = await request.formData();
  const file = formData.get('photo') as File | null;

  if (!file) return error(400, 'No photo provided');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(file.type)) {
    return error(415, 'Unsupported image type');
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Strip EXIF by re-encoding through sharp — removes all metadata
  const stripped = await sharp(buffer)
    .rotate() // auto-rotate based on EXIF orientation before stripping
    .withMetadata({ exif: {} }) // replace EXIF with empty object
    .jpeg({ quality: 90 })
    .toBuffer();

  const filename = `${userId}/${Date.now()}.jpg`;
  const storagePath = `photos/${filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('photos')
    .upload(storagePath, stripped, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) return error(500, uploadError.message);

  const { data: urlData } = supabaseAdmin.storage
    .from('photos')
    .getPublicUrl(storagePath);

  return json({
    storage_path: storagePath,
    public_url: urlData.publicUrl
  });
};
