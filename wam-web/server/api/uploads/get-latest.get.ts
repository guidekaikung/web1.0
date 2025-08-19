import { defineEventHandler, getQuery, createError, setHeader, sendStream, sendRedirect } from 'h3'
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'
import FileModel from '~/server/models/file'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const request_no = String(q.request_no || '').trim()
  const step       = String(q.step || '').trim()
  const fallback   = q.fallback ? String(q.fallback) : '' // ชื่อไฟล์เทมเพลต เช่น ZAAR020.docx

  if (!request_no || !step) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request_no or step' })
  }

  // หาไฟล์ล่าสุดของ request + step
  const file = await FileModel.findOne({ request_no, step }).sort({ uploadedAt: -1, createdAt: -1 })
  if (file) {
    // ง่ายสุด: redirect ไป endpoint ดาวน์โหลดตาม id ที่มีอยู่แล้ว
    return sendRedirect(event, `/api/uploads/get-download?id=${file._id}`, 302)
  }

  // ถ้าไม่มีไฟล์ → ส่งไฟล์แม่แบบ (ถ้าระบุ fallback มา)
  if (fallback) {
    const filePath = join(process.cwd(), 'public', 'templates', fallback)
    if (!existsSync(filePath)) {
      throw createError({ statusCode: 404, statusMessage: 'Template not found' })
    }
    setHeader(event, 'Content-Disposition', `attachment; filename="${fallback}"`)
    return sendStream(event, createReadStream(filePath))
  }

  throw createError({ statusCode: 404, statusMessage: 'No file and no template' })
})
