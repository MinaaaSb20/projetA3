
// models/Script.js
import mongoose from "mongoose";


const scriptSchema = mongoose.Schema({
    generatedText: { type: String },
    summarizedText: { type: String }
  }, { timestamps: true });
  
  export default mongoose.models.Script || mongoose.model('Script', scriptSchema);
