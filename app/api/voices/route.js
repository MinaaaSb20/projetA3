import { NextResponse } from 'next/server'
import connectMongo from '@/libs/mongoose'
import Voice from '@/models/Voice'

export async function GET() {
  try {
    await connectMongo();
    console.log('MongoDB connected for voices fetch');

    // First, try to get voices from the database
    let voices = await Voice.find({}).lean();

    // If no voices in database, fetch from ElevenLabs and save them
    if (!voices || voices.length === 0) {
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
      const elevenlabsVoices = data.voices;

      // Save voices to database
      voices = await Promise.all(
        elevenlabsVoices.map(async (voice) => {
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

      console.log(`Saved ${voices.length} voices to database`);
    }

    return NextResponse.json(voices);
  } catch (error) {
    console.error('Error fetching/saving voices:', error);
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
  }
} 