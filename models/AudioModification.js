import mongoose from 'mongoose';

const AudioModificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Conversation',
  },
  audioUrl: {
    type: String,
    required: true,
  },
  effects: {
    low: Number,
    mid: Number,
    high: Number,
    compression: Number,
    reverb: Number
  },
  backgroundSound: String,
  backgroundVolume: Number,
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'completed'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

AudioModificationSchema.index({ userId: 1, createdAt: -1 });
AudioModificationSchema.index({ userId: 1, backgroundSound: 1 });

export default mongoose.models.AudioModification || mongoose.model('AudioModification', AudioModificationSchema); 