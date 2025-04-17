import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectMongo from '@/libs/mongoose';
import Document from '@/models/DocumentSummary';

export async function GET(req) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    console.log('Fetching documents for conversation:', conversationId);

    if (!conversationId) {
      console.log('No conversationId provided');
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const documents = await Document.find({ 
      conversationId: conversationId 
    })
    .select('fileName fileUrl summary createdAt conversationId')
    .sort({ createdAt: -1 })
    .lean();

    console.log('Found documents for conversation:', conversationId, documents);

    return NextResponse.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error in document-summaries GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
} 