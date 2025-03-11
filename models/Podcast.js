import mongoose from "mongoose";

const podcastSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    conversationId: {
      type: String,
      required: true
    },
    messageId: {
      type: String,
      default: null
    },
    voiceId: {
      type: String,
      required: true
    },
    audioUrl: {
      type: String,
      default: null
    },
    duration: Number,
    scriptContent: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing'
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

// Add logging for debugging
podcastSchema.pre('validate', function(next) {
  console.log('Validating podcast data:', this.toObject());
  next();
});

// Clear the existing model if it exists
mongoose.models = {};

// Create and export the model
const Podcast = mongoose.model("Podcast", podcastSchema);
export default Podcast; 