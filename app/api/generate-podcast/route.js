import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import Podcast from '@/models/Podcast'
import Conversation from '@/models/Conversation'
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

    if (!voiceId || !text || !conversationId) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Voice ID, text, and conversation ID are required'
      }, { status: 400 });
    }

    // Verify the conversation exists and belongs to the user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: session.user.id
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or unauthorized'
      }, { status: 404 });
    }

    // Create new podcast document
    const podcast = new Podcast({
      userId: session.user.id,
      voiceId,
      scriptContent: text,
      conversationId,
      status: 'processing',
      title: conversation.title,
      messageId: conversation.messageId,
      audioUrl: null,
      duration: null,
      backgroundSound: null
    });

    // Generate audio using ElevenLabs
    const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to generate audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Update podcast with audio data
    podcast.audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
    podcast.status = 'completed';
    await podcast.save();

    // Update conversation with the new podcast
    conversation.podcasts = conversation.podcasts || [];
    conversation.podcasts.push(podcast._id);
    await conversation.save();

    return NextResponse.json({
      success: true,
      podcastId: podcast._id,
      audio: audioBase64,
      conversationId: conversationId,
      message: 'Podcast generated and saved successfully',
      title: conversation.title,
      messageId: conversation.messageId,
      scriptContent: text,
      audioUrl: null,
      duration: null,
      backgroundSound: null
    });

  } catch (error) {
    console.error('Error generating podcast:', error);
    return NextResponse.json({ 
      error: 'Failed to generate podcast',
      details: error.message 
    }, { status: 500 });
  }
}

