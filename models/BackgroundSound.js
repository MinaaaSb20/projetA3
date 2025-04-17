import mongoose from 'mongoose';

const BackgroundSoundSchema = new mongoose.Schema({
  name: String,
  category: String,
  url: String,
  duration: Number,
  previewUrl: String,
});

export default mongoose.models.BackgroundSound || mongoose.model('BackgroundSound', BackgroundSoundSchema); 