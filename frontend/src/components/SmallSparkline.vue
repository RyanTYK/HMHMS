<template>
  <canvas ref="canvas" :width="width" :height="height" aria-label="Response time sparkline" class="w-full h-full rounded-md shadow-sm"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  width: {
    type: Number,
    default: 120
  },
  height: {
    type: Number,
    default: 32
  }
});

const canvas = ref(null);
let chartInstance = null;

const renderChart = () => {
  console.log('Rendering sparkline chart with data:', props.data);
  if (!canvas.value) {
    console.warn('Canvas ref not available');
    return;
  }
  
  if (!props.data || props.data.length === 0) {
    console.log('No data to render, skipping chart');
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }
  
  // Update existing chart instead of destroying and recreating
  if (chartInstance) {
    chartInstance.data.labels = props.data.map((_, i) => i + 1);
    chartInstance.data.datasets[0].data = props.data;
    chartInstance.update('none'); // No animation for updates
    return;
  }
  
  try {
    chartInstance = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.data.map((_, i) => i + 1),
      datasets: [{
        data: props.data,
        borderColor: '#cb128a',
        backgroundColor: 'rgba(203,18,138,0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { 
          display: false,
          grid: { display: false }
        },
        y: { 
          display: false,
          grid: { display: false },
          beginAtZero: true
        }
      },
      elements: { 
        line: { 
          borderJoinStyle: 'round',
          tension: 0.4
        },
        point: {
          radius: 0
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // Disable animation for sparklines to prevent blinking
      }
    }
  });
  } catch (error) {
    console.error('Error creating chart:', error);
  }
};

onMounted(renderChart);
watch(() => props.data, renderChart);
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>

<style scoped>
canvas {
  display: block;
}
</style>
