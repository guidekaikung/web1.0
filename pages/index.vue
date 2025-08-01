<template>
  <div class="q-pa-lg">
    <div class="text-h5 q-mb-md">สรุปสถานะเอกสาร</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4" v-for="(chartData, index) in charts" :key="index">
        <q-card class="q-pa-md">
          <div class="text-subtitle2 q-mb-sm">
            {{ chartTitles[index] }}
            </div>
          <Pie :data="chartData" :options="chartOptions" />
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Pie } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(ChartDataLabels)
ChartJS.register(Title, Tooltip, Legend, ArcElement)
import type { ChartOptions } from 'chart.js'

const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom'  
    },
    datalabels: {
      color: '#fff',
      font: { weight: 'bold' },
      formatter: (value: number, context: any) => {
        const dataset = context.chart.data.datasets[0].data
        const total = dataset.reduce((a: number, b: number) => a + b, 0)
        const percent = ((value / total) * 100).toFixed(0)
        return `${percent}%`
      }
      
    }
  }
}
const chartTitles = [
  'กฟจ.นครสวรรค์ (CEO)',
  'กฟจ.ชัยนาท (CEO)',
  'กฟจ.สิงห์บุรี (CEO)',
  'กฟจ.ลพบุรี (CEO)',
  'กฟจ.อุทัยธานี CEO',
  'กฟจ.เพชรบูรณ์ CEO'
]

const charts = ref([
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [30, 70,],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [90,10],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [70,30],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [70,30],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [30,70],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [6,4],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  }
])
</script>
