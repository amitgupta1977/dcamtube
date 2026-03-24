import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

async function saveCity(name: string, country: string) {
  try {
    await prisma.city.create({ data: { name, country } });
  } catch {
    // Ignore if already exists
  }
}

async function saveRoad(name: string, cityName: string) {
  try {
    await prisma.road.create({ data: { name, city: cityName } });
  } catch {
    // Ignore if already exists
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const country = formData.get('country') as string;
    const city = formData.get('city') as string;
    const road = formData.get('road') as string;
    const incidentType = formData.get('incidentType') as string;
    const incidentDate = formData.get('incidentDate') as string;
    const vendorId = formData.get('vendorId') as string;

    if (!file || !country || !city || !road || !incidentType || !incidentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'videos');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const videoUrl = `/videos/${filename}`;

    let user = await prisma.user.findFirst({
      where: { email: `vendor-${vendorId}@godashreel.com` }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `vendor-${vendorId}@godashreel.com`,
          name: `Vendor ${vendorId}`
        }
      });
    }

    const video = await prisma.video.create({
      data: {
        videoUrl,
        thumbnailUrl: videoUrl,
        duration: 0,
        country,
        city,
        road,
        incidentType,
        incidentDate: new Date(incidentDate),
        approved: false,
        userId: user.id
      }
    });

    await saveCity(city, country);
    await saveRoad(road, city);

    return NextResponse.json({ 
      success: true, 
      videoId: video.id,
      message: 'Video uploaded successfully. Pending approval.'
    });
  } catch (error) {
    console.error('External upload error:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}
