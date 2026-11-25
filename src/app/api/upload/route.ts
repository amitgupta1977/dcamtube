import { NextRequest, NextResponse } from 'next/server';
import { SClient } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getCurrentUser } from '@/lib/auth';

const MAX_BYTES = 100 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(['videos', 'thumbnails']);
const ALLOWED_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Please log in to upload' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('type') as string) || 'videos';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }
    // Only videos and images: anything else (web pages, scripts) could be served from our bucket.
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only MP4, MOV or AVI videos are allowed' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File is too large' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${uniqueSuffix}-${safeName}`;

    await SClient.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      success: true,
      videoUrl: publicUrl,
      thumbnailUrl: publicUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
