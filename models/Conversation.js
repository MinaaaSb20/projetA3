import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String, // Keep as String to match NextAuth's ID format
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for better query performance
ConversationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);