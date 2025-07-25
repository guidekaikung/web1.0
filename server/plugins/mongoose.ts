import mongoose from 'mongoose'

export default defineNitroPlugin(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/fileuploads')
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection error:', err)
  }
})
