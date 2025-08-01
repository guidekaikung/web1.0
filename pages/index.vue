<template>
  <div class="q-pa-lg">
    <div class="text-h5 q-mb-md">สรุปสถานะเอกสาร</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4" v-for="(chartData, index) in charts" :key="index">
        <q-card class="q-pa-md">
          <div class="text-subtitle2 q-mb-sm">กลุ่มที่ {{ index + 1 }}</div>
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


const charts = ref([
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [4, 8,],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [9,7],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [1,3],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [7,8],
        backgroundColor: ['#16A34A','#6B7280']
      }
    ]
  },
  {
    labels: ['ตัดจำหน่ายแล้ว', 'รออนุมัติจำหน่าย'],
    datasets: [
      {
        data: [3,1],
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
