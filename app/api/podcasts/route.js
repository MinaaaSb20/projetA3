import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import Podcast from '@/models/Podcast'
import connectMongo from '@/libs/mongoose';

export async function GET(request) {
  try {
    await connectMongo()
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const podcasts = await Podcast.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .populate('conversationId', 'title')
      .lean()

    return NextResponse.json(podcasts)
  } catch (error) {
    console.error('Error fetching podcasts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 