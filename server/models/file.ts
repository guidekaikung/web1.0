import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
  originalFilename: String,
  storedFilename: { type: String },
  mimetype: String,
  step: String,
  data: Buffer,
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // ✅ เพิ่มตรงนี้
  documentNo: String,
  dateSigned: String,
  amount: Number,
})

export default mongoose.models.File || mongoose.model('File', fileSchema)
