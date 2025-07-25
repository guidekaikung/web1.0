import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import type { File as FormidableFile } from 'formidable'
import FileModel from '~/server/models/file'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default defineEventHandler(async (event) => {
  const form = formidable({ multiples: false, keepExtensions: true })

  return await new Promise((resolve, reject) => {
    form.parse(event.node.req, async (err, fields, files) => {
      if (err) return reject(err)

      const file = (files.file?.[0] || files.file) as FormidableFile
      if (!file) {
        return resolve({ success: false, error: 'ไม่พบไฟล์ที่อัปโหลด' })
      }

      const step = (fields.step || 'unknown').toString()

      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
      const ext = path.extname(file.originalFilename || '').toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        return resolve({ success: false, error: 'ไม่อนุญาตให้ส่งไฟล์ประเภทนี้' })
      }

      // ✅ อ่านไฟล์เป็น buffer แล้วบันทึกลง MongoDB
      const buffer = fs.readFileSync(file.filepath)

      try {
        const result = await FileModel.create({
          originalFilename: file.originalFilename,
          mimetype: file.mimetype,
          step,
          data: buffer,
        })
        console.log('✅ MongoDB saved:', result)
        return resolve({ success: true, id: result._id })
      } catch (error) {
        console.error('❌ MongoDB save error:', error)
        return resolve({ success: false, error: 'บันทึก MongoDB ไม่สำเร็จ' })
      }
    })
  })
})
