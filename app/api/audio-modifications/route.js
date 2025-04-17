import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectMongo from '@/libs/mongoose';
import { GridFSBucket } from 'mongodb';

export async function POST(request) {
  try {
    // Get both db and mongoose connection
    const { db, mongoose } = await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Get the audio file and other data
    const audioFile = formData.get('audio');
    const conversationId = formData.get('conversationId');
    const effects = formData.get('effects');
    const backgroundSound = formData.get('backgroundSound');
    const backgroundVolume = formData.get('backgroundVolume');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: 'Invalid audio file' }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Parse effects
    let parsedEffects = {};
    try {
      parsedEffects = effects ? JSON.parse(effects) : {};
    } catch (e) {
      console.error('Error parsing effects:', e);
      return NextResponse.json({ error: 'Invalid effects data' }, { status: 400 });
    }

    // Create GridFS bucket with the db instance
    const bucket = new GridFSBucket(db);

    // Store audio file in GridFS
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const uploadStream = bucket.openUploadStream(`audio-${Date.now()}.wav`);
    
    // Create a promise to handle the upload
    const uploadPromise = new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    // Write the buffer to GridFS
    uploadStream.write(audioBuffer);
    uploadStream.end();

    // Wait for upload to complete
    await uploadPromise;

    // Create metadata document
    const audioModification = {
      userId: session.user.id,
      conversationId: conversationId.toString(),
      audioFileId: uploadStream.id,
      effects: parsedEffects,
      backgroundSound: backgroundSound || null,
      backgroundVolume: backgroundVolume ? parseFloat(backgroundVolume) : null,
      createdAt: new Date()
    };

    // Save metadata to collection
    const result = await db.collection('audioModifications').insertOne(audioModification);

    return NextResponse.json({
      success: true,
      modificationId: result.insertedId,
      audioFileId: uploadStream.id
    });

  } catch (error) {
    console.error('Error saving audio modification:', error);
    return NextResponse.json({ 
      error: 'Failed to save modifications',
      details: error.message 
    }, { status: 500 });
  }
}

// Update GET to retrieve from GridFS
export async function GET(request) {
  try {
    const { db } = await connectMongo();
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Get modifications metadata
    const modifications = await db.collection('audioModifications')
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .toArray();

    // For each modification, create a temporary URL for the audio
    const bucket = new GridFSBucket(db);
    const modifiedResults = modifications.map(mod => ({
      ...mod,
      audioUrl: `/api/audio/${mod.audioFileId}` // You'll need to create this endpoint
    }));
    
    return NextResponse.json(modifiedResults);
  } catch (error) {
    console.error('Error fetching audio modifications:', error);
    return NextResponse.json({ error: 'Failed to fetch modifications' }, { status: 500 });
  }
} 