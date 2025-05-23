import mongoose from "mongoose";

const voiceSchema = mongoose.Schema(
  {
    voice_id: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    category: String,
    description: String,
    preview_url: String,
    settings: {
      stability: {
        type: Number,
        default: 0.5
      },
      similarity_boost: {
        type: Number,
        default: 0.5
      }
    }
  },
  {
    timestamps: true
  }
);

voiceSchema.pre('save', function(next) {
  console.log('Saving voice:', this.toObject());
  next();
});

mongoose.models = {};

const Voice = mongoose.model("Voice", voiceSchema);
export default Voice; 