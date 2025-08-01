<template>
  <div class="q-pa-md">
    <q-markup-table separator="vertical" wrap-cells>
      <thead>
        <tr>
          <th class="text-center" style="width: 10%">TIMELINE</th>
          <th class="text-center">ลำดับ</th>
          <th class="text-center">ผู้ดำเนินการ</th>
          <th class="text-center">ขั้นตอน/รายละเอียด</th>
          <th class="text-center">เอกสาร</th>
          <th class="text-center">Action</th>
          <th class="text-center">เลขที่หนังสือ</th>
          <th class="text-center">หมายเหตุ</th>
          <th class="text-center">ลงวันที่</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in model" :key="i">
          <td style="position: relative">
            <div class="timeline" :class="timelineClass(row, i)">
              <q-icon
                v-if="typeof row.no === 'number'"
                :name="row.status === 20 ? 'check_circle' : 'schedule'"
                :color="row.status === 20 ? 'green' : 'grey'"
                size="30px"
                style="z-index: 10; background-color: white; border-radius: 50%"
              />
              <div
                v-else
                class="timeline timeline-line-full"
                :class="
                  row.status === 20
                    ? 'success-top success-bottom'
                    : 'unsuccess-top unsuccess-bottom'
                "
              ></div>
            </div>
          </td>
          <td class="text-left">{{ row.no }}</td>
          <td class="text-left">{{ row.operator }}</td>
          <td class="text-left">{{ row.detail }}</td>

          <!-- เอกสาร -->
          <td class="text-left">
            <template v-if="row.file && !['1','4.2','6','9','12'].includes(String(row.no))">
              <q-btn
                dense flat color="primary"
                :label="row.document || 'ดาวน์โหลด'"
                @click="downloadFile(row.file)"
              />
            </template>
            <template v-else>
              {{ row.document || '-' }}
            </template>
          </td>

          <!-- Action -->
<td class="text-left">
  <template v-if="!['4.1', '4.2', '6', '7.1', '7.2'].includes(String(row.no))">
    <div class="column">
      <q-btn flat label="Upload" @click="openUploadDialog(i)" />
      <small v-if="row.document_hint" class="text-caption text-grey">
        เอกสารที่ต้องใช้: {{ row.document_hint }}
      </small>
    </div>
  </template>
</td>

          <!-- เลขที่หนังสือ + จำนวนเงิน -->
          <td class="text-left">
            <template v-if="row.amount">
              {{ row.document_no }} — จำนวนเงิน: {{ formatAmount(row.amount) }}
            </template>
            <template v-else>
              {{ row.document_no || '-' }}
            </template>
          </td>

          <td class="text-left">{{ row.comment }}</td>
          <td class="text-left">{{ row.createdAt ? row.createdAt.split('T')[0] : row.date }}</td>
        </tr>
      </tbody>
    </q-markup-table>

    <!-- ✅ ข้อ 3: Upload Popup -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">อัปโหลดเอกสาร</div>
        </q-card-section>

        <q-card-section>
          <q-file v-model="uploadForm.file" label="เลือกไฟล์เอกสาร" filled />
          <q-input v-model="uploadForm.date_signed" label="วันที่ลงหนังสือ" type="date" filled class="q-mt-sm" />

          <q-input
            v-if="['2','3'].includes(String(currentStep?.no))"
            v-model="uploadForm.document_no"
            label="เลขที่หนังสือ"
            filled class="q-mt-sm"
          />

          <q-input
            v-if="String(currentStep?.no) === '9'"
            v-model.number="uploadForm.amount"
            label="จำนวนเงิน"
            type="number"
            filled class="q-mt-sm"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" v-close-popup />
          <q-btn color="primary" label="อัปโหลด" @click="confirmUpload" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showDialog = ref(false)
const currentIndex = ref(-1)
const currentStep = ref<TimelineItem | null>(null)

const uploadForm = ref({
  file: null as File | null,
  date_signed: '',
  document_no: '',
  amount: null as number | null
})

function openUploadDialog(index: number) {
  currentIndex.value = index
  currentStep.value = model.value[index] || null
  showDialog.value = true
  uploadForm.value = {
    file: null,
    date_signed: '',
    document_no: currentStep.value?.document_no || '',
    amount: currentStep.value?.amount || null
  }
}

async function confirmUpload() {
  const stepNo = currentStep.value?.no
  const file = uploadForm.value.file
  if (!file || !stepNo) return

  const allowedExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.pdf']
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowedExtensions.includes(ext)) {
    $q.notify({ type: 'negative', message: 'ไฟล์ไม่อยู่ในรูปแบบที่อนุญาต' })
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('step', String(stepNo))
  formData.append('date_signed', uploadForm.value.date_signed)
  formData.append('document_no', uploadForm.value.document_no || '')
  if (uploadForm.value.amount !== null && uploadForm.value.amount !== undefined && !isNaN(uploadForm.value.amount)) {
    formData.append('amount', String(uploadForm.value.amount))
  }
  try {
    const res = await axios.post('/api/uploads/upload', formData)
    if (!res.data.success) throw new Error(res.data.error)

    const item = model.value[currentIndex.value]
    if (item) {
      item.file = res.data.id
      item.document_no = uploadForm.value.document_no
      item.amount = uploadForm.value.amount ?? undefined
      item.date_signed = uploadForm.value.date_signed
      item.createdAt = res.data.createdAt || new Date().toISOString()
    }

    $q.notify({ type: 'positive', message: 'อัปโหลดเรียบร้อย' })
    showDialog.value = false
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการอัปโหลด' })
  }
}

function formatAmount(value: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(value) + ' บาท'
}


interface TimelineItem {
  no: number | string;
  operator: string;
  detail: string;
  status: number;
  statusDesciption: string;
  document: string;
  document_no: string;
  date: string;
  comment: string;
  file?: string; 
  amount?: number; 
  date_signed?: string; 
  document_hint?: string; 
  createdAt?: string
}

const step = ref(10);
// const model = ref<TimelineItem[]>([]);

// const { data: responseData, error } = await useFetch("/api/get-approve-detail");

// if (error.value) {
//   console.error("Error fetching data:", error.value);
// } else {
//   if (responseData.value) {
//     model.value = responseData.value; // Assign only if responseData.value is not null
//   } else {
//     console.warn("No data received.");
//   }
// }

  const model = ref<TimelineItem[]>([
    {
          no: 1,
          operator: 'กฟฟ.',
          detail:   'Upload File ZAAR020 (from SAP)',
          document: 'File ZAAR020  รายงานขออนุมัติจำหน่ายมิเตอร์ชำรุด',
          document_no: '',
          status: 20,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'File ZAAR020'
        },
        {
          no: 2,
          operator: 'กฟฟ.',
          detail: 'รายงานผลจากคณะกรรมการสอบหาข้อเท็จจริง (ส่งหนังสือถึง กบล.)',
          document: 'หนังสือขออนุมัติจำหน่ายมิเตอร์และอุปกรณ์ประกอบ',
          document_no: '-',
          status: 20,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'หนังสือขออนุมัติจำหน่ายมิเตอร์และอุปกรณ์ประกอบ'
        },
        {
          no: 3,
          operator: 'กบล.',
          detail: `อนุมัติจำหน่าย`,
          document: 'หนังสืออนุมัติจำหน่ายจากผู้มีอำนาจลงนาม',
          document_no: '-',
          status: 20,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'หนังสืออนุมัติจำหน่ายจากผู้มีอำนาจลงนาม'
        },
        {
          no: 4,
          operator: `คณะกรรมการประเมินราคา`,
          detail: 'กำหนดราคาขายขั้นต่ำ โดยดำเนินการตามข้อ 5 และ 6',
          document: 'คำนวณราคาและขออนุมัติเห็นชอบราคาขายขั้นต่ำ',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'ใบขออนุมัติเห็นชอบราคาขายขั้นต่ำ'
        },
        {
          no: '4.1',
          operator: 'คณะกรรมการประเมินราคา',
          detail: 'คำนวณราคาขายของมิเตอร์ ซีที พีที',
          document: 'ตารางคำนวณการประเมินราคา',
          document_no: '',
          status: 20,
          statusDesciption: '',
          date: '',
          comment:'',
        },
        {
          no: '4.2',
          operator: `คณะกรรมการประเมินราคา`,
          detail: `เสนอผู้มีอำนาจฯ*เห็นชอบราคาขั้นต่ำ`,
          document: 'หนังสืออนุมัติเห็นชอบราคาขายขั้นต่ำ',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
        },
        {
          no: 5,
          operator: 'กฟฟ.',
          detail: 'จัดทำหนังสือขออนุมัติหลักการขายจากผู้มีอำนาจสั่งขาย',
          document: 'หนังสืออนุมัติหลักการขาย',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'หนังสืออนุมัติหลักการขาย'
        },
        {
          no: 6,
          operator: 'กฟฟ.',
          detail: 'วิธีการขาย มี 3 วิธี',
          document: '',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:''
        },
        {
          no: 7,
          operator: 'กฟฟ.',
          detail: 'จัดทำเอกสารประกาศขายและเผยแพร่การขาย (แจ้ง กบพ.ลงประกาศ)',
          document: 'เอกสารประกาศขายและเผยแพร่การขาย',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'เอกสารประกาศขาย'
        },
        {
          no: '7.1',
          operator: 'คณะกรรมการดำเนินการขาย',
          detail: 'ผู้สนใจเข้ารับซอง ให้ กฟฟ.จัดทำเอกสารลงทะเบียนการรับซอง (ตามวันที่กำหนดไว้ในหนังสือประกาศขาย)',
          document: 'เอกสารลงทะเบียน',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:''
        }
        ,
        {
          no: '7.2',
          operator: 'กฟฟ.',
          detail: `ผู้เสนอราคายื่นซองเสนอราคา พร้อมวางหลักประกันซอง
      (ยื่นซองฯ พร้อมวางหลักประกัน 5%) ให้ กฟฟ.จัดทำทะเบียนรับซองเสนอราคา และทำตารางเปรียบเทียบราคา`,
          document: 'ทะเบียนการรับเอกสาร พร้อมวางหลักประกันซอง และตารางเปรียบเทียบราคาเปิดซอง',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:''
        },
        {
          no: 8,
          operator: 'คณะกรรมการดำเนินการขาย',
          detail: `ขออนุมัติรับราคาและขออนุมัติหลักการขายจากผู้มีอำนาจสั่งขาย`,
          document: 'หนังสืออนุมัติรับราคา',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'หนังสืออนุมัติรับราคา'
        }
        ,
        {
          no: 9,
          operator: 'คณะกรรมการดำเนินการขาย',
          detail: `รับชำระเงิน และออกใบเสร็จให้ผู้รับซื้อ`,
          document: 'ใบเสร็จรับเงิน',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'ใบเสร็จรับเงิน และ ใส่จำนวนเงิน'
        } ,
        {
          no: 10,
          operator: 'กฟฟ.',
          detail: `ตัดจำหน่าย (ZMME024) และพิมพ์ใบจ่ายของ (ตัดจำหน่าย MIGO MvT 555)`,
          document: 'ใบจ่ายของ (ตัดจำหน่าย MvT 555)',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'ใบจ่ายของ (ตัดจำหน่าย MvT 555)'
        },
        {
          no: 11,
          operator: 'คณะกรรมการส่งมอบพัสดุ',
          detail: `คณะกรรมการส่งมอบพัสดุ ทำหนังสือรายงานผลการดำเนินการขาย และส่งมอบ`,
          document: 'หนังสือรายงานการส่งมอบและรับมอบ',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'หนังสือรายงานการส่งมอบและรับมอบ'
        },
        {
          no: 12,
          operator: 'คณะกรรมการส่งมอบพัสดุ',
          detail: `รายงานผลการขาย ส่งให้ กบฟ. เพื่อตัดจำหน่ายออกจากบัญชีสินทรัพย์`,
          document: 'หนังสือรายงานการขาย',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'หนังสือรายงานการขาย'
        },
        {
          no: 13,
          operator: 'กบฟ.',
          detail: `ตัดจำหน่ายทรัพย์สินออกจากระบบบัญชีสินทรัพย์`,
          document: 'ตัดจำหน่ายทรัพย์สิน (AA)',
          document_no: '',
          status: 10,
          statusDesciption: '',
          date: '',
          comment:'',
          document_hint:'ตัดจำหน่ายทรัพย์สิน (AA)'
        }
      
]);

import axios from 'axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const fileInputRefs = ref<HTMLInputElement[]>([])

const setFileInputRef = (el: HTMLInputElement | null, index: number) => {
  if (el) fileInputRefs.value[index] = el
}

const triggerUpload = (index: number) => {
  const input = fileInputRefs.value[index]
  if (input) input.click()
}

const handleFileChange = async (event: Event, stepNo: number | string) => {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return

  const allowedExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.pdf']
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

  if (!allowedExtensions.includes(fileExtension)) {
    $q.notify({ type: 'negative', message: 'อนุญาตเฉพาะไฟล์ .doc .docx .xls .xlsx .pdf เท่านั้น' })
    input.value = ''
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('step', String(stepNo))

  try {
const res = await axios.post('/api/uploads/upload', formData)
if (!res.data.success) {
  $q.notify({ type: 'negative', message: res.data.error || 'อัปโหลดล้มเหลว' })
  return
}

const fileId = res.data.id

// ⬇️ อัปเดต document สำหรับ step ที่อัปโหลด
await axios.put(`/api/approve-detail/${stepNo}`, {
  document: fileId
})

$q.notify({ type: 'positive', message: 'อัปโหลดและบันทึกสำเร็จ' })

    const index = model.value.findIndex((row) => row.no === stepNo)
    if (index !== -1 && model.value[index]) {
      model.value[index].document = file.name
      model.value[index].file = res.data.id
    }
  } catch (err) {
    console.error('❌ Upload error:', err)
    $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' })
  } finally {
    input.value = ''
  }
}

function timelineClass(row: TimelineItem, index: number) {
  let response = ''
  if (row.status === 20) {
    response += 'success-top success-bottom '
    if (index === 0) {
      response += 'timeline-line-bottom'
    } else if (model.value[index - 1]?.status === 20) {
      response += 'timeline-line-full'
    } else if (index + 1 === model.value.length) {
      response += 'timeline-line-top'
    } else if (model.value[index + 1]?.status) {
      response += 'timeline-line-top timeline-line-bottom'
    }
  } else if (row.status === 10) {
    if (model.value[index - 1]?.status === 20) {
      response += 'success-top unsuccess-bottom timeline-line-top timeline-line-bottom'
    } else if (index === model.value.length - 1) {
      response += 'unsuccess-top timeline-line-top timeline-line-bottom'
    } else {
      response += 'unsuccess-top unsuccess-bottom timeline-line-top timeline-line-bottom'
    }
  }
  return response
}

const downloadFile = async (id: string) => {
  try {
    const res = await fetch(`/api/uploads/get-download?id=${encodeURIComponent(id)}`)
    if (!res.ok) throw new Error('ไม่พบไฟล์')

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition')

    let filename = 'download.pdf'
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=UTF-8''(.+)/)
      const simpleMatch = disposition.match(/filename="(.+)"/)
      if (utf8Match && utf8Match[1]) {
        filename = decodeURIComponent(utf8Match[1])
      } else if (simpleMatch && simpleMatch[1]) {
        filename = simpleMatch[1]
      }
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    $q.notify({ type: 'negative', message: 'ไม่พบไฟล์สำหรับดาวน์โหลด' })
  }
  function formatAmount(value: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(value) + ' บาท';
}
}
</script>

<style scoped>
.timeline {
  width: 30px;
  margin: 0 auto;
}
.unsuccess-top::before {
  background-color: #959595 !important;
}
.unsuccess-bottom::after {
  background-color: #959595 !important;
}
.unsuccess-full::before,
.unsuccess-full::after {
  background-color: #959595 !important;
}
.success-top::before {
  background-color: #4caf50 !important;
}
.success-bottom::after {
  background-color: #4caf50 !important;
}
.success-full::before,
.success-full::after {
  background-color: #4caf50 !important;
}
.timeline-line-full::before {
  content: "";
  position: absolute;
  width: 2px;
  height: 100%;
  transform: translate(-50%);
  top: 0;
  left: 50%;
  z-index: 0;
}
.timeline-line-top::before {
  content: "";
  position: absolute;
  width: 2px;
  height: 50%;
  transform: translate(-50%);
  top: 0;
  left: 50%;
  z-index: 0;
}
.timeline-line-bottom::after {
  content: "";
  position: absolute;
  width: 2px;
  height: 50%;
  transform: translate(-50%);
  bottom: 0;
  left: 50%;
  z-index: 0;
}
</style>
