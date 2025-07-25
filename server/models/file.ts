import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
  originalFilename: String,
  mimetype: String,
  step: String,
  data: Buffer,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.File || mongoose.model('File', fileSchema)
