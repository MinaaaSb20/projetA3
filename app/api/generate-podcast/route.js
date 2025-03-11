import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import Podcast from '@/models/Podcast'
import connectMongo from '@/libs/mongoose'

export async function POST(request) {
  try {
    await connectMongo();
    console.log('MongoDB connected successfully');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { voiceId, text, conversationId } = await request.json();
    
    // Validate required fields
    if (!voiceId || !text || !conversationId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: { voiceId: !!voiceId, text: !!text, conversationId: !!conversationId }
      }, { status: 400 });
    }

    // Create initial podcast document
    const podcast = new Podcast({
      userId: session.user.id,
      conversationId: conversationId,
      voiceId: voiceId,
      scriptContent: text,
      status: 'processing'
    });

    // Save initial state
    await podcast.save();
    console.log('Initial podcast saved:', podcast._id);

    // Generate audio
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      }
    );

    if (!response.ok) {
      // Update status to failed if audio generation fails
      podcast.status = 'failed';
      await podcast.save();
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: 'ElevenLabs API error', details: errorData }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    
    // Update podcast with audio and completed status
    podcast.audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
    podcast.status = 'completed';
    
    const savedPodcast = await podcast.save();
    console.log('Podcast updated with audio:', savedPodcast._id);

    return NextResponse.json({ 
      audio: base64Audio,
      podcastId: savedPodcast._id,
      success: true 
    });

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
} 