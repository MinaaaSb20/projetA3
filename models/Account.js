import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  providerAccountId: {
    type: String,
    required: true
  },
  access_token: {
    type: String,
    required: true
  },
  expires_at: {
    type: Number
  },
  scope: String,
  token_type: String,
  id_token: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique provider accounts per user
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
AccountSchema.index({ userId: 1 });

export default mongoose.models.Account || mongoose.model('Account', AccountSchema); 