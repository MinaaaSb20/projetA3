import mongoose from 'mongoose';
import toJSON from './plugins/toJSON';

const messageSchema = mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

messageSchema.plugin(toJSON);

messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema); 