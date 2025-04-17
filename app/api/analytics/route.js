// import { NextResponse } from 'next/server';
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/next-auth";
// import connectMongo from "@/libs/mongoose";
// import User from "@/models/User";


// // Analytics functions
// async function getEffectsAnalytics(userId) {
//   const { db } = await connectMongo();
//   return db.collection('audioModifications')
//     .aggregate([
//       { $match: { userId: userId.toString() } },
//       { $unwind: '$effects' },
//       { $project: { 
//         effectType: { $objectToArray: '$effects' } 
//       }},
//       { $unwind: '$effectType' },
//       { $group: {
//         _id: '$effectType.k',
//         avgValue: { $avg: '$effectType.v' },
//         count: { $sum: 1 }
//       }},
//       { $sort: { count: -1 } }
//     ]).toArray();
// }

// async function getBackgroundSoundsAnalytics(userId) {
//   const { db } = await connectMongo();
//   return db.collection('audioModifications')
//     .aggregate([
//       { 
//         $match: { 
//           userId: userId.toString(),
//           backgroundSound: { $ne: null }
//         } 
//       },
//       { $group: {
//         _id: '$backgroundSound',
//         count: { $sum: 1 },
//         avgVolume: { $avg: '$backgroundVolume' }
//       }},
//       { $sort: { count: -1 } }
//     ]).toArray();
// }

// async function getVoiceAnalytics(userId) {
//   const { db } = await connectMongo();
//   return db.collection('podcasts')
//     .aggregate([
//       { 
//         $match: { 
//           userId: userId.toString(),
//           voiceId: { $exists: true, $ne: null }
//         } 
//       },
//       { $group: { _id: '$voiceId', count: { $sum: 1 } }},
//       {
//         $lookup: {
//           from: 'voices',
//           localField: '_id',
//           foreignField: 'voice_id',
//           as: 'voiceInfo'
//         }
//       },
//       { $unwind: { path: '$voiceInfo', preserveNullAndEmptyArrays: true }},
//       {
//         $project: {
//           count: 1,
//           name: '$voiceInfo.name',
//           category: '$voiceInfo.category'
//         }
//       },
//       { $sort: { count: -1 } },
//       { $limit: 5 }
//     ]).toArray();
// }

// export async function GET(request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Find user by email
//     await connectMongo();
//     const user = await User.findOne({ email: session.user.email });
//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const userId = user._id.toString();
    
//     // Add debug logs
//     console.log("Analytics requested for:", {
//       email: session.user.email,
//       userId: userId
//     });

//     const [effects, backgroundSounds, voices] = await Promise.all([
//       getEffectsAnalytics(userId),
//       getBackgroundSoundsAnalytics(userId),
//       getVoiceAnalytics(userId)
//     ]);

//     return NextResponse.json({
//       effects,
//       backgroundSounds,
//       voices
//     });

//   } catch (error) {
//     console.error("Analytics error:", error);
//     return NextResponse.json({ 
//       error: "Failed to fetch analytics",
//       details: error.message 
//     }, { status: 500 });
//   }
// } 