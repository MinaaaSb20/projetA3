// models/Analytics.js
import mongoose from "mongoose";

const analyticsSchema = mongoose.Schema({
    listenersCount: {
      type: Number,
      default: 0
    },
    avgListenDuration: Number,
    sharesCount: {
      type: Number,
      default: 0
    },
    podcastEpisode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PodcastEpisode',
      required: true
    }
  }, { timestamps: true });
  
  export default mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);