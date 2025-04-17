import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String,
    required: true 
  },
  messages: [{
    role: String,
    content: String,
    timestamp: Date
  }],
  podcasts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Podcast'
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

ConversationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema); 