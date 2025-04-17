import mongoose from 'mongoose';

const PodcastExportSchema = new mongoose.Schema({
  podcastId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'AudioModification'
  },
  userId: { 
    type: String, 
    required: true 
  },
  format: { 
    type: String, 
    enum: ['mp3', 'aac', 'mp4'], 
    required: true 
  },
  processedAudioUrl: {
    type: String,
    required: true
  },
  shareableLink: {
    type: String,
    unique: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing'
  }
}, {
  timestamps: true
});

PodcastExportSchema.index({ userId: 1 });

let PodcastExport;
try {
  PodcastExport = mongoose.model('PodcastExport');
} catch (error) {
  PodcastExport = mongoose.model('PodcastExport', PodcastExportSchema);
}

export default PodcastExport; 