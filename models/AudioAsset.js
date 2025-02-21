// models/AudioAsset.js
import mongoose from "mongoose";

const audioAssetSchema = mongoose.Schema({
    type: { 
      type: String, 
      required: true 
    },
    filePath: { 
      type: String, 
      required: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    }
  }, { timestamps: true });
  
  export default mongoose.models.AudioAsset || mongoose.model('AudioAsset', audioAssetSchema);
  