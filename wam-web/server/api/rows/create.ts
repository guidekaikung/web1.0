import Row from '~/server/models/Row'
import Timeline from '~/server/models/Timeline'
import { makeTimelineTemplate } from '~/server/utils/timelineTemplate'
import dbConnect from '~/server/utils/db'
import { sendError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    await dbConnect()

    const lastRow = await Row.findOne().sort({ created_at: -1 }).exec()
    let nextNumber = 1
    if (lastRow?.request_no) {
      const m = lastRow.request_no.match(/WAMCLBR(\d+)/)
      if (m) nextNumber = parseInt(m[1]) + 1
    }
    const newRequestNo = `WAMCLBR${nextNumber.toString().padStart(4, '0')}`

    const newRow = new Row({
      request_no: newRequestNo,
      book_no: body.book_no,
      book_date: body.book_date
    })
    await newRow.save()

    const exists = await Timeline.findOne({ request_no: newRequestNo }).lean()
    if (!exists) {
      await Timeline.create({
        request_no: newRequestNo,
        steps: makeTimelineTemplate()
      })
    }

    return { success: true, request_no: newRequestNo }
  } catch (error: any) {
    console.error('[CREATE ERROR]', error?.message || error)
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Create Failed' }))
  }
})
