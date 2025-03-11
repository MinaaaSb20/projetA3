// app/api/conversation/route.js
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Conversation from '@/models/Conversation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';

// GET /api/conversation - Get all conversations for the user
export async function GET(request) {
  await connectMongo();
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const conversations = await Conversation
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 });
      
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/conversation - Create a new conversation
export async function POST(request) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("No session or user ID found"); // Debug log
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    console.log("Creating conversation with user ID:", session.user.id); // Debug log
    
    const conversation = await Conversation.create({
      title: body.title || "New Conversation",
      userId: session.user.id
    });

    console.log("Conversation created:", conversation); // Debug log
    
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Conversation creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create conversation',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}