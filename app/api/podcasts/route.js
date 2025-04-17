import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import Podcast from '@/models/Podcast'
import connectMongo from '@/libs/mongoose';


export async function GET(req) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    // Only select necessary fields
    const podcasts = await Podcast.find({
      userId,
      conversationId,
      isDeleted: { $ne: true }
    })
    .select('_id title audioUrl createdAt conversationId')
    .sort({ createdAt: -1 })
    .lean()
    .limit(10); // Limit the number of podcasts returned

    return NextResponse.json({ success: true, podcasts });
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch podcasts' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Make sure audioUrl is included
    if (!data.audioUrl) {
      return NextResponse.json(
        { success: false, error: 'Audio URL is required' },
        { status: 400 }
      );
    }
    
    const podcast = await Podcast.create({
      userId: data.userId,
      conversationId: data.conversationId,
      voiceId: data.voiceId,
      scriptContent: data.scriptContent,
      title: data.title,
      audioUrl: data.audioUrl, // Save the audio URL
      description: data.description || '',
      status: data.status || 'completed',
      duration: data.duration || 0,
      metadata: data.metadata || {}
    });

    return NextResponse.json({ success: true, podcast });
  } catch (error) {
    console.error('Error creating podcast:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create podcast' },
      { status: 500 }
    );
  }
} 