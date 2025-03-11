// app/api/message/route.js
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';

// GET /api/message - Get messages for a conversation
export async function GET(request) {
  await connectMongo();
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Extract query params
  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId');
  
  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
  }
  
  try {
    const messages = await Message
      .find({ conversationId })
      .sort({ createdAt: 1 });
      
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/message - Create a new message
export async function POST(request) {
  await connectMongo();
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { conversationId, role, content } = body;
    
    if (!conversationId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const message = await Message.create({
      conversationId,
      role,
      content
    });
    
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}