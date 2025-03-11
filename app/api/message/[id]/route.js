// app/api/message/[id]/route.js
import { NextResponse } from "next/server"
import connectMongo from "@/libs/mongoose"
import Message from "@/models/Message"
import { getServerSession } from "next-auth"
import { authOptions } from "@/libs/next-auth"

// PUT /api/message/[id] - Update a message
export async function PUT(request, { params }) {
  await connectMongo()

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id } = params
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const message = await Message.findByIdAndUpdate(id, { content }, { new: true })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

// DELETE /api/message/[id] - Delete a message
export async function DELETE(request, { params }) {
  await connectMongo()

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id } = params
  try {
    const message = await Message.findByIdAndDelete(id)

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}

