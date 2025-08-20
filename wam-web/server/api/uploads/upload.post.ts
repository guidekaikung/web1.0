import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import type { File as FormidableFile } from 'formidable'
import FileModel from '~/server/models/file'
import Timeline from '~/server/models/Timeline'

// ถ้าใช้ Nitro/Nuxt 3 ไม่จำเป็นต้องกำหนด bodyParser ตรงนี้ก็ได้
export const config = {
  api: { bodyParser: false },
}

export default defineEventHandler(async (event) => {
  const form = formidable({ multiples: false, keepExtensions: true })

  // helper: ดึงค่าจาก formidable fields ให้เป็น string เดียว
  const getField = (v: any) => (Array.isArray(v) ? v[0] : v)

  return await new Promise((resolve, reject) => {
    form.parse(event.node.req, async (err, fields, files) => {
      try {
        if (err) return reject(err)

        const file = (files.file?.[0] || files.file) as FormidableFile
        if (!file) {
          return resolve({ success: false, error: 'ไม่พบไฟล์ที่อัปโหลด' })
        }

        // ===== อ่านค่าจากฟอร์ม =====
        const requestNo = String(getField(fields.request_no || '')).trim()   // ✅ ต้องส่งมาจากฝั่งหน้าเว็บ
        const stepKey   = String(getField(fields.step || '')).trim()
        const documentNo = String(getField(fields.document_no || '')).trim()
        const dateSigned = String(getField(fields.date_signed || '')).trim()
        const amountRaw  = getField(fields.amount)
        const amount = amountRaw !== undefined && amountRaw !== ''
          ? Number(amountRaw)
          : undefined

        const originalName = file.originalFilename || 'unknown'
        const mimetype = (file as any).mimetype || ''   // บางเวอร์ชันของ formidable ใช้ file.mimetype

        // ===== ตรวจชนิดไฟล์ =====
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx','.txt']
        const ext = path.extname(originalName).toLowerCase()
        if (!allowedExtensions.includes(ext)) {
          return resolve({ success: false, error: 'ไม่อนุญาตให้ส่งไฟล์ประเภทนี้' })
        }

        // ===== อ่านไฟล์เป็น buffer =====
        const buffer = fs.readFileSync(file.filepath)

        // ===== ตั้งชื่อไฟล์เก็บใน DB =====
        const now = new Date()
        const datePart = now.toISOString().split('T')[0] // YYYY-MM-DD
        const nameOnly = path.parse(originalName).name.replace(/\s+/g, '_')
        const storedFilename = `${stepKey}__${nameOnly}__${datePart}${ext}`

        // ===== บันทึกไฟล์ลง MongoDB (ครั้งเดียวพอ) =====
        const created = await FileModel.create({
          request_no: requestNo,        // ✅ เก็บเลขคำขอไว้ใช้ค้นไฟล์ล่าสุด
          step: stepKey,
          storedFilename,
          originalFilename: originalName,
          mimetype,
          uploadedAt: now,
          documentNo,
          dateSigned,
          amount,
          data: buffer                   // เนื้อไฟล์จริง
        })

        // ===== อัปเดต Timeline เป็น done =====
        // หมายเหตุ: ใน DB ฟิลด์ status ใช้ค่าประเภท string: 'pending' | 'done'
        if (requestNo && stepKey) {
          const tl = await Timeline.findOne({ request_no: requestNo })
          if (tl) {
            const st: any = tl.steps.find((s: any) => String(s.no) === stepKey)
            if (st) {
              st.status = 'done'
              if (documentNo) st.document_no = documentNo
              if (dateSigned) st.date_signed = dateSigned
              if (amount !== undefined && !Number.isNaN(amount)) st.amount = amount
              // จะผูก id ไฟล์ไว้ด้วยก็ได้ ถ้า schema มี field เช่น st.file
              // st.file = created._id
              await tl.save()
            }
          }
        }

        // ===== ส่งผลลัพธ์กลับ =====
        return resolve({
          success: true,
          id: created._id,
          filename: storedFilename,
          originalName: originalName,
          createdAt: (created as any).createdAt ?? now,
          timelineUpdated: Boolean(requestNo && stepKey)
        })
      } catch (e) {
        console.error(e)
        return resolve({ success: false, error: 'อัปโหลดไม่สำเร็จ' })
      }
    })
  })
})
