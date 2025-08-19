import mongoose from 'mongoose'
const { Schema } = mongoose

const fileSchema = new Schema({
  request_no:       { type: String, required: true, index: true },
  step:             { type: String, required: true, index: true },
  storedFilename:   { type: String, required: true },
  originalFilename: { type: String, required: true },
  mimetype:         { type: String },
  uploadedAt:       { type: Date, default: Date.now },
  documentNo:       { type: String },
  dateSigned:       { type: String },
  amount:           { type: Number },
  data:             { type: Schema.Types.Buffer }
})

fileSchema.index({ request_no: 1, step: 1, uploadedAt: -1 })

export default mongoose.models.File || mongoose.model('File', fileSchema)
