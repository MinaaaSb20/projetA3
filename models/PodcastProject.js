// models/PodcastProject.js
import mongoose from "mongoose";



const podcastProjectSchema = mongoose.Schema({
  description: String,
  name: { 
    type: String, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { timestamps: true });

export default mongoose.models.PodcastProject || mongoose.model('PodcastProject', podcastProjectSchema);
