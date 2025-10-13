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
                @update:model-value="onDateChange"
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
import { toRaw } from 'vue'

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
      isUpdating: false,
      chartDataSnapshot: null,
      hourlyDataSnapshot: null,
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
    // 清理所有快照数据
    this.chartDataSnapshot = null
    this.hourlyDataSnapshot = null
  },
  watch: {
    data: {
      handler(newData) {
        if (!this.isUpdating) {
          this.createDataSnapshot(newData)
          this.$nextTick(() => {
            this.updateChart()
          })
        }
      },
      deep: false
    }
  },
  methods: {
    createDataSnapshot(data) {
      try {
        // 使用toRaw完全去除响应式，然后深拷贝
        const rawData = toRaw(data)
        this.chartDataSnapshot = JSON.parse(JSON.stringify(rawData || []))
      } catch (error) {
        console.error('Error creating data snapshot:', error)
        this.chartDataSnapshot = []
      }
    },

    createHourlyDataSnapshot(hourlyData) {
      try {
        // 使用toRaw完全去除响应式，然后深拷贝
        const rawHourlyData = toRaw(hourlyData)
        this.hourlyDataSnapshot = JSON.parse(JSON.stringify(rawHourlyData || []))
      } catch (error) {
        console.error('Error creating hourly data snapshot:', error)
        this.hourlyDataSnapshot = []
      }
    },

    getChartData() {
      // 使用快照数据，完全隔离响应式系统
      const data = this.chartDataSnapshot || []
      const hourlyData = this.hourlyDataSnapshot || []
      const chartType = this.type || 'daily'

      if (chartType === 'daily' && hourlyData.length > 0) {
        // For daily chart with hourly data
        const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
        const revenues = Array.from({ length: 24 }, (_, i) => {
          const hourData = hourlyData.find(h => h.hour === i)
          return hourData ? parseFloat(hourData.revenue) || 0 : 0
        })

        return {
          labels: [...labels],
          datasets: [{
            label: 'Hourly Revenue',
            data: [...revenues],
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        }
      }

      // Original logic for monthly or daily without hourly data
      if (!data || data.length === 0) {
        return {
          labels: [],
          datasets: []
        }
      }

      const labels = data.map(item => {
        if (chartType === 'daily') {
          // Handle both aggregated daily revenue data (with 'date' field) and raw sales data (with 'time' field)
          let dateStr = item.date || item.time
          if (!dateStr) {
            return 'Invalid Date'
          }
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            return 'Invalid Date'
          }
          // 使用本地时间显示
          return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
          })
        } else {
          return item.month || 'Unknown Month'
        }
      })

      const revenues = data.map(item => {
        // Handle both aggregated revenue data (with 'revenue' field) and raw sales data (with 'price' field)
        const revenue = parseFloat(item.revenue || item.price || 0)
        return isNaN(revenue) ? 0 : revenue
      })

      return {
        labels: [...labels],
        datasets: [{
          label: chartType === 'daily' ? 'Daily Revenue' : 'Monthly Revenue',
          data: [...revenues],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      }
    },

    getChartOptions() {
      // 完全避免任何响应式引用，使用硬编码值
      const chartType = this.type || 'daily'
      const hasHourlyData = this.hourlyDataSnapshot && this.hourlyDataSnapshot.length > 0
      const isDailyWithHourly = chartType === 'daily' && hasHourlyData
      
      // 创建完全隔离的配置对象
      const options = {
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
      
      // 深拷贝配置对象，确保完全隔离
      return JSON.parse(JSON.stringify(options))
    },

    createChart() {
      if (!this.$refs.chartCanvas) {
        console.warn('RevenueChart: Canvas element not found')
        return
      }
      
      try {
        // Destroy existing chart if it exists
        if (this.chart) {
          this.chart.destroy()
          this.chart = null
        }

        // 创建初始数据快照
        this.createDataSnapshot(this.data)
        this.createHourlyDataSnapshot(this.hourlyData)

        const chartData = this.getChartData()
        const chartOptions = this.getChartOptions()

        if (!chartData || !chartData.labels || !chartData.datasets) {
          console.warn('RevenueChart: Invalid chart data', chartData)
          return
        }

        // 创建完全隔离的配置对象
        const isolatedConfig = {
          type: 'line',
          data: {
            labels: [...chartData.labels],
            datasets: chartData.datasets.map(dataset => ({
              ...dataset,
              data: [...dataset.data]
            }))
          },
          options: JSON.parse(JSON.stringify(chartOptions))
        }

        this.chart = new Chart(this.$refs.chartCanvas, isolatedConfig)
      } catch (error) {
        console.error('RevenueChart: Error creating chart:', error)
      }
    },
    
    updateChart() {
      if (this.isUpdating) return
      
      // 清除之前的更新定时器，防止重复更新
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout)
      }
      
      this.isUpdating = true
      
      // 使用setTimeout延迟更新，避免在响应式更新过程中立即更新图表
      this.updateTimeout = setTimeout(() => {
        try {
          if (this.chart) {
            // 更新数据快照
            this.createDataSnapshot(this.data)
            this.createHourlyDataSnapshot(this.hourlyData)
            
            const chartData = this.getChartData()
            
            if (!chartData || !chartData.labels || !chartData.datasets) {
              console.warn('RevenueChart: Invalid update data', chartData)
              this.isUpdating = false
              return
            }
            
            // 创建完全隔离的新数据对象
            const isolatedLabels = [...chartData.labels]
            const isolatedDatasets = chartData.datasets.map(dataset => ({
              label: dataset.label,
              data: [...dataset.data],
              borderColor: dataset.borderColor,
              backgroundColor: dataset.backgroundColor,
              borderWidth: dataset.borderWidth,
              fill: dataset.fill,
              tension: dataset.tension,
              pointRadius: dataset.pointRadius,
              pointHoverRadius: dataset.pointHoverRadius
            }))
            
            // 安全地更新图表数据，完全避免响应式引用
            this.chart.data.labels = isolatedLabels
            this.chart.data.datasets = isolatedDatasets
            
            this.chart.update('none')
          } else {
            // 只有在图表不存在时才创建新图表，避免递归调用
            this.createChart()
          }
        } catch (error) {
          console.error('RevenueChart: Error updating chart:', error)
          // 发生错误时，销毁现有图表并重新创建
          if (this.chart) {
            this.chart.destroy()
            this.chart = null
          }
          this.createChart()
        } finally {
          this.isUpdating = false
          this.updateTimeout = null
        }
      }, 0)
    },

    onDateChange() {
      // 防止在更新过程中触发新的更新
      if (this.isUpdating) return
      
      this.hourlyData = []
      if (this.selectedDate) {
        this.loadHourlyData()
      } else {
        this.updateChart()
      }
    },

    async loadHourlyData() {
      if (!this.selectedDate || this.isUpdating) return

      this.loadingHourlyData = true
      try {
        const hourlyData = await this.fetchHourlyRevenueData(this.selectedDate)
        this.hourlyData = hourlyData
        // 创建小时数据快照
        this.createHourlyDataSnapshot(hourlyData)
        // 使用nextTick确保数据更新完成后再更新图表
        this.$nextTick(() => {
          this.updateChart()
        })
      } catch (error) {
        console.error('Failed to load hourly data:', error)
        this.$emit('error', 'Failed to load hourly revenue data')
      } finally {
        this.loadingHourlyData = false
      }
    },

    async fetchHourlyRevenueData(selectedDate) {
      console.log('Fetching hourly data for:', selectedDate)
      
      try {
        if (!this.data || this.data.length === 0) {
          console.warn('No data available for hourly calculation')
          return []
        }
        
        // Check if this is aggregated daily revenue data (has 'date' field) or raw sales data (has 'time' field)
        const isAggregatedData = this.data.some(item => item.date && !item.time)
        
        if (isAggregatedData) {
          // For aggregated daily revenue data, we can't calculate hourly breakdown
          // Return empty array or show a message that hourly data is not available
          console.warn('Hourly data calculation not available for aggregated daily revenue data')
          return []
        }
        
        const selectedDateObj = new Date(selectedDate)
        const startOfDay = new Date(selectedDateObj)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDateObj)
        endOfDay.setHours(23, 59, 59, 999)
        
        const dayData = this.data.filter(item => {
          if (!item.time) return false
          const itemDate = new Date(item.time)
          // 使用本地时间进行比较，不需要手动添加时区偏移
          return itemDate >= startOfDay && itemDate <= endOfDay
        })
        
        const hourlyMap = new Map()
        for (let hour = 0; hour < 24; hour++) {
          hourlyMap.set(hour, 0)
        }
        
        dayData.forEach(item => {
          if (item.time) {
            const itemDate = new Date(item.time)
            // 使用本地时间获取小时，不需要手动添加时区偏移
            const hour = itemDate.getHours()
            const revenue = parseFloat(item.price) || 0
            hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + revenue)
          }
        })
        
        const hourlyData = Array.from(hourlyMap.entries())
          .map(([hour, revenue]) => ({
            hour: hour,
            revenue: Math.round(revenue * 100) / 100
          }))
          .sort((a, b) => a.hour - b.hour)
        
        return hourlyData
        
      } catch (error) {
        console.error('Error calculating hourly data:', error)
        return []
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
