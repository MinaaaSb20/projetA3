import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Podcast from '@/models/Podcast';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectMongo();
    console.log('MongoDB connected in test endpoint');

    // Count existing podcasts
    const count = await Podcast.countDocuments();
    console.log('Current podcast count:', count);

    return NextResponse.json({ 
      status: 'Connected',
      podcastCount: count,
      databaseName: mongoose.connection.db.databaseName
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 