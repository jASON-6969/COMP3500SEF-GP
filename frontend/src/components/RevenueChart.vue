<template>
  <div class="revenue-chart">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon left color="primary">mdi-chart-line</v-icon>
        {{ title }}
        <v-spacer></v-spacer>
        <v-chip color="success" variant="outlined">
          Total: ${{ totalRevenue.toLocaleString() }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <!-- Day Selector for Daily Revenue Trend -->
        <div v-if="type === 'daily'" class="mb-4">
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="selectedDate"
                label="Select Day"
                type="date"
                prepend-icon="mdi-calendar"
                variant="outlined"
                density="compact"
                :max="new Date().toISOString().split('T')[0]"
                @update:model-value="onDateChange"
                @blur="onDateChange"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-btn
                color="primary"
                variant="outlined"
                @click="loadHourlyData"
                :loading="loadingHourlyData"
                :disabled="!selectedDate"
              >
                <v-icon left>mdi-refresh</v-icon>
                Load Hourly Data
              </v-btn>
            </v-col>
          </v-row>
        </div>
        
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'
import { 
  calculateHourlyRevenue, 
  getChartLabels, 
  getChartData 
} from '../lib/revenueUtils'

export default {
  name: 'RevenueChart',
  props: {
    data: {
      type: Array,
      required: true
    },
    type: {
      type: String,
      required: true,
      validator: value => ['daily', 'monthly'].includes(value)
    },
    title: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      chart: null,
      selectedDate: '',
      loadingHourlyData: false,
      hourlyData: [],
      updateTimeout: null
    }
  },
  computed: {
    totalRevenue() {
      if (!this.data || !Array.isArray(this.data)) {
        return 0
      }
      return this.data.reduce((sum, item) => {
        const revenue = parseFloat(item.revenue)
        return sum + (isNaN(revenue) ? 0 : revenue)
      }, 0)
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.createChart()
    })
  },
  beforeUnmount() {
    // 清理定时器
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
      this.updateTimeout = null
    }
    
    // 销毁图表
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  watch: {
    data: {
      handler(newData, oldData) {
        // 防止无限递归：只有当数据真正改变时才更新
        if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
          this.debouncedUpdateChart()
        }
      },
      deep: true
    },
    hourlyData: {
      handler(newData, oldData) {
        // 防止无限递归：只有当数据真正改变时才更新
        if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
          this.debouncedUpdateChart()
        }
      },
      deep: true
    }
  },
  methods: {
    debouncedUpdateChart() {
      // 清除之前的定时器
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout)
      }
      
      // 设置新的定时器，防抖延迟100ms
      this.updateTimeout = setTimeout(() => {
        this.$nextTick(() => {
          this.updateChart()
        })
      }, 100)
    },

    getChartConfig() {
      const chartType = this.type || 'daily'
      const hasHourlyData = this.hourlyData.length > 0
      const isDailyWithHourly = chartType === 'daily' && hasHourlyData
      
      let labels, datasets
      
      if (isDailyWithHourly) {
        // 小时数据图表
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
        const revenues = Array.from({ length: 24 }, (_, i) => {
          const hourData = this.hourlyData.find(h => h.hour === i)
          return hourData ? hourData.revenue : 0
        })
        
        datasets = [{
          label: 'Hourly Revenue',
          data: revenues,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      } else {
        // 日/月数据图表
        labels = getChartLabels(this.data, chartType)
        const revenues = getChartData(this.data)
        
        datasets = [{
          label: chartType === 'daily' ? 'Daily Revenue' : 'Monthly Revenue',
          data: revenues,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      }
      
      return {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 750,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: isDailyWithHourly ? 'Time (Hours)' : (chartType === 'daily' ? 'Date' : 'Month')
              },
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Revenue ($)'
              },
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString()
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      }
    },

    createChart() {
      if (!this.$refs.chartCanvas) {
        console.warn('RevenueChart: Canvas element not found')
        return
      }
      
      // 检查Canvas元素是否已挂载到DOM
      if (!this.$refs.chartCanvas.parentNode) {
        console.warn('RevenueChart: Canvas element not mounted to DOM')
        return
      }
      
      try {
        if (this.chart) {
          this.chart.destroy()
          this.chart = null
        }

        const config = this.getChartConfig()
        
        // 确保Canvas有正确的尺寸
        const canvas = this.$refs.chartCanvas
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = canvas.offsetWidth || 400
          canvas.height = canvas.offsetHeight || 300
        }
        
        this.chart = new Chart(canvas, config)
      } catch (error) {
        console.error('RevenueChart: Error creating chart:', error)
        // 如果创建失败，清理chart引用
        this.chart = null
      }
    },
    
    updateChart() {
      if (!this.chart) {
        this.createChart()
        return
      }
      
      // 检查chart是否仍然有效
      if (!this.chart.canvas || !this.chart.canvas.parentNode) {
        console.warn('RevenueChart: Chart canvas is no longer valid, recreating...')
        this.createChart()
        return
      }
      
      try {
        const config = this.getChartConfig()
        this.chart.data.labels = config.data.labels
        this.chart.data.datasets = config.data.datasets
        this.chart.update('none')
      } catch (error) {
        console.error('RevenueChart: Error updating chart:', error)
        // 如果更新失败，尝试重新创建图表
        this.createChart()
      }
    },

    onDateChange() {
      // 清除之前的小时数据
      this.hourlyData = []
      
      // 如果选择了日期，则加载小时数据
      if (this.selectedDate) {
        this.loadHourlyData()
      }
      // 注意：不在这里调用updateChart()，让watch监听器处理
    },

    async loadHourlyData() {
      if (!this.selectedDate) return

      this.loadingHourlyData = true
      try {
        // 计算小时数据
        const hourlyData = calculateHourlyRevenue(this.data, this.selectedDate)
        this.hourlyData = hourlyData
        
        // 注意：不在这里调用updateChart()，让watch监听器处理hourlyData的变化
        
      } catch (error) {
        console.error('Failed to load hourly data:', error)
        this.$emit('error', 'Failed to load hourly revenue data')
        this.hourlyData = []
      } finally {
        this.loadingHourlyData = false
      }
    }
  }
}
</script>

<style scoped>
.revenue-chart {
  width: 100%;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

canvas {
  max-height: 400px;
}
</style>





