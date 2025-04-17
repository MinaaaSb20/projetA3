import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import BackgroundSound from '@/models/BackgroundSound';

export async function GET() {
  try {
    await connectMongo();

    const sounds = await BackgroundSound.find({}).lean();
    return NextResponse.json(sounds);
  } catch (error) {
    console.error('Error fetching background sounds:', error);
    return NextResponse.json({ error: 'Failed to fetch background sounds' }, { status: 500 });
  }
} 