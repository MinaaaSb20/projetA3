import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const { db } = await connectMongo();
    const bucket = new GridFSBucket(db);
    
    const fileId = new ObjectId(params.id);
    const downloadStream = bucket.openDownloadStream(fileId);
    
    const chunks = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    return NextResponse.json({ error: 'Failed to stream audio' }, { status: 500 });
  }
} 