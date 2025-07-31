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
      const documentNo = (fields.document_no || '').toString()
      const dateSigned = (fields.date_signed || '').toString()
      const amount = fields.amount ? parseFloat(fields.amount.toString()) : null

      const originalName = file.originalFilename || 'unknown'

      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
      const ext = path.extname(originalName).toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        return resolve({ success: false, error: 'ไม่อนุญาตให้ส่งไฟล์ประเภทนี้' })
      }

      const buffer = fs.readFileSync(file.filepath)

      const now = new Date()
      const datePart = now.toISOString().split('T')[0] // YYYY-MM-DD
      const nameOnly = path.parse(originalName).name.replace(/\s+/g, '_')
      const storageName = `${step}__${nameOnly}__${datePart}${ext}`
      

      const savePath = path.join(process.cwd(), 'public/uploads', storageName)
      fs.writeFileSync(savePath, buffer)

      // ✅ บันทึกชื่อเดิมไว้ใน MongoDB ด้วย
      const created = await FileModel.create({
      step,
      filename: storageName,
      originalName,
      uploadedAt: now,
      documentNo,
      dateSigned,
      amount,
      })

      return resolve({
        success: true,
        id: created._id,
        filename: storageName,
        originalName
      })
    })
  })
})
