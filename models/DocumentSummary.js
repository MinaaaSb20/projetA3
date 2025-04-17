import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    ref: 'Conversation'
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
DocumentSchema.index({ conversationId: 1 });
DocumentSchema.index({ createdAt: -1 });

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema); 