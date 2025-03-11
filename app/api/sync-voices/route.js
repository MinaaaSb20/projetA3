import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Voice from '@/models/Voice';

export async function POST() {
  try {
    await connectMongo();
    console.log('MongoDB connected for voice sync');

    // Fetch voices from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices from ElevenLabs');
    }

    const data = await response.json();
    const voices = data.voices;

    // Save each voice to the database
    const savedVoices = await Promise.all(
      voices.map(async (voice) => {
        const voiceData = {
          voice_id: voice.voice_id,
          name: voice.name,
          category: voice.category,
          description: voice.description || '',
          preview_url: voice.preview_url,
          settings: {
            stability: voice.settings?.stability || 0.5,
            similarity_boost: voice.settings?.similarity_boost || 0.5
          }
        };

        // Use findOneAndUpdate to avoid duplicates
        return Voice.findOneAndUpdate(
          { voice_id: voice.voice_id },
          voiceData,
          { upsert: true, new: true }
        );
      })
    );

    console.log(`Synced ${savedVoices.length} voices`);

    return NextResponse.json({ 
      success: true, 
      voiceCount: savedVoices.length,
      voices: savedVoices
    });

  } catch (error) {
    console.error('Error syncing voices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 