// models/PodcastEpisode.js
import mongoose from "mongoose";

const podcastEpisodeSchema = mongoose.Schema({
    title: { 
      type: String, 
      required: true 
    },
    content: String,
    audioFile: String,
    status: {
      type: String,
      enum: ['draft', 'processing', 'published', 'failed'],
      default: 'draft'
    },
    script: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Script',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PodcastProject',
      required: true
    },
    audioAssets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AudioAsset'
    }],
    platforms: [{
      platform: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Platform'
      },
      publishedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }, { timestamps: true });
  
  export default mongoose.models.PodcastEpisode || mongoose.model('PodcastEpisode', podcastEpisodeSchema);
  