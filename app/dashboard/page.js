import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/libs/next-auth"
import connectMongo from "@/libs/mongoose"
import User from "@/models/User"
import Podcast from "@/models/Podcast"
import PodcastExport from "@/models/PodcastExport"
import mongoose from "mongoose"
import DashboardClient from "./DashboardClient"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin")
  }

  try {
    await connectMongo()

    const user = await User.findOne({ email: session.user.email }).lean()

    if (!user) {
      throw new Error("User not found")
    }

    // Get data from the correct collection with proper userId format
    const effectsAnalytics = await mongoose.connection
      .collection("audioModifications")
      .aggregate(
        [
          { $match: { userId: user._id.toString() } },
          { $limit: 1000 }, // Limit early
          { $unwind: "$effects" },
          { $project: { effectType: { $objectToArray: "$effects" } } },
          { $unwind: "$effectType" },
          {
            $group: {
              _id: "$effectType.k",
              avgValue: { $avg: "$effectType.v" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ],
        {
          allowDiskUse: true,
        },
      )
      .toArray()

    // Background sounds analytics
    const backgroundSoundsAnalytics = await mongoose.connection
      .collection("audioModifications")
      .aggregate(
        [
          {
            $match: {
              userId: user._id.toString(),
              backgroundSound: { $ne: null },
            },
          },
          { $limit: 1000 }, // Limit early
          {
            $group: {
              _id: "$backgroundSound",
              count: { $sum: 1 },
              avgVolume: { $avg: "$backgroundVolume" },
            },
          },
          { $sort: { count: -1 } },
        ],
        {
          allowDiskUse: true,
        },
      )
      .toArray()

    // Get total counts
    const podcastCount = await Podcast.countDocuments({ userId: user._id })
    const exportsCount = await PodcastExport.countDocuments({ userId: user._id })

    // Get voice usage analytics
    const voiceAnalytics = await mongoose.connection
      .collection("podcasts")
      .aggregate(
        [
          {
            $match: {
              userId: user._id.toString(),
              voiceId: { $exists: true, $ne: null },
            },
          },
          { $limit: 1000 }, // Limit before heavy operations
          {
            $group: {
              _id: "$voiceId",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "voices",
              localField: "_id",
              foreignField: "voice_id",
              as: "voiceInfo",
            },
          },
          { $unwind: { path: "$voiceInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              count: 1,
              name: "$voiceInfo.name",
              category: "$voiceInfo.category",
            },
          },
        ],
        {
          allowDiskUse: true,
        },
      )
      .toArray()

    // Get user podcasts with pagination and conversation titles
    const page = 1
    const limit = 10
    const userPodcasts = await Podcast.aggregate(
      [
        {
          $match: {
            userId: user._id.toString(),
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "conversations",
            let: { convId: { $toObjectId: "$conversationId" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$convId"] },
                },
              },
              {
                $project: {
                  title: 1,
                },
              },
            ],
            as: "conversation",
          },
        },
        {
          $addFields: {
            title: {
              $cond: {
                if: { $gt: [{ $size: "$conversation" }, 0] },
                then: { $arrayElemAt: ["$conversation.title", 0] },
                else: "$title",
              },
            },
          },
        },
      ],
      {
        allowDiskUse: true,
      }
    )

    // Get total count for pagination
    const totalPodcasts = await Podcast.countDocuments({
      userId: user._id.toString(),
    })

    // Add this to your existing analytics queries
    const podcastProductionAnalytics = await mongoose.connection
      .collection("podcasts")
      .aggregate(
        [
          {
            $match: {
              userId: user._id.toString(),
              createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
              count: { $sum: 1 },
              completed: {
                $sum: {
                  $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                },
              },
              processing: {
                $sum: {
                  $cond: [{ $eq: ["$status", "processing"] }, 1, 0],
                },
              },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ],
        {
          allowDiskUse: true,
        },
      )
      .toArray()

    // Convert Mongoose documents to plain objects
    const serializedData = {
      user: JSON.parse(JSON.stringify(user)),
      podcastCount,
      exportsCount,
      voiceAnalytics: JSON.parse(JSON.stringify(voiceAnalytics)),
      effectsAnalytics: JSON.parse(JSON.stringify(effectsAnalytics)),
      backgroundSoundsAnalytics: JSON.parse(JSON.stringify(backgroundSoundsAnalytics)),
      userPodcasts: JSON.parse(JSON.stringify(userPodcasts)),
      podcastProductionAnalytics: JSON.parse(JSON.stringify(podcastProductionAnalytics))
    };

    return <DashboardClient initialData={serializedData} />

  } catch (error) {
    console.error("Dashboard Error:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
            <h2 className="text-red-500 font-semibold text-lg">Error loading dashboard</h2>
            <p className="text-gray-400 mt-2">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    )
  }
}

