import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { voiceId, text } = await request.json()

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
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
      }
    )

    if (!response.ok) {
      throw new Error('Failed to generate speech')
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Audio = buffer.toString('base64')

    return NextResponse.json({ audio: base64Audio })
  } catch (error) {
    console.error('Error generating speech:', error)
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 })
  }
} 