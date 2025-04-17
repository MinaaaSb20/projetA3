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
    duration: { type: Number },
    scriptContent: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'processing'],
      default: 'draft'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => new Map()
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

podcastSchema.index({ userId: 1, conversationId: 1 });
podcastSchema.index({ status: 1 });
podcastSchema.index({ userId: 1, createdAt: -1 });
podcastSchema.index({ userId: 1, voiceId: 1 });

podcastSchema.pre('validate', function(next) {
  console.log('Validating podcast data:', this.toObject());
  next();
});

podcastSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

podcastSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

podcastSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

mongoose.models = {};

const Podcast = mongoose.model("Podcast", podcastSchema);
export default Podcast; 