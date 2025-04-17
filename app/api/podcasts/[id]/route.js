import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Podcast from '@/models/Podcast';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';

export async function DELETE(request, { params }) {
  try {
    await connectMongo();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Find the podcast
    const podcast = await Podcast.findOne({
      _id: id,
      userId: session.user.id
    });
    
    if (!podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    // Soft delete instead of actual deletion
    await podcast.softDelete();
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete podcast' }, { status: 500 });
  }
}
