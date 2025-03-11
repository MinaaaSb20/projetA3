// app/api/conversation/[id]/route.js
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Podcast from '@/models/Podcast';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';

// GET /api/conversation/[id] - Get a single conversation with messages and podcasts
export async function GET(request, { params }) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { id } = params;
    
    const conversation = await Conversation.findOne({
      _id: id,
      userId: session.user.id
    });
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch associated podcasts
    const podcasts = await Podcast.find({
      conversationId: id,
      status: 'completed'
    }).sort({ createdAt: -1 });
    
    // Return conversation with podcasts
    return NextResponse.json({
      ...conversation.toObject(),
      podcasts
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

// PUT /api/conversation/[id] - Update a conversation
export async function PUT(request, { params }) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    const { title } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId: session.user.id }, // Ensure user owns the conversation
      { title },
      { new: true }
    );
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

// DELETE /api/conversation/[id] - Delete a conversation, its messages, and podcasts
export async function DELETE(request, { params }) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Find and delete the conversation
    const conversation = await Conversation.findOneAndDelete({
      _id: id,
      userId: session.user.id
    });
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Delete all associated messages and podcasts
    await Promise.all([
      Message.deleteMany({ conversationId: id }),
      Podcast.deleteMany({ conversationId: id })
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}