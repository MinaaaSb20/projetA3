// models/Platform.js
import mongoose from "mongoose";


const platformSchema = mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    url: { 
      type: String, 
      required: true 
    }
  }, { timestamps: true });
  
  export default mongoose.models.Platform || mongoose.model('Platform', platformSchema);
  