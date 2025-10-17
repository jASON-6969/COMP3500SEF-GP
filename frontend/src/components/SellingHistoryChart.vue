<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon left color="primary">mdi-chart-line</v-icon>
      Selling History Chart
      <v-spacer></v-spacer>
      <v-chip color="primary" variant="outlined">
        {{ chartData.length }} Data Points
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <!-- Chart Controls -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1">
          <v-icon left>mdi-filter</v-icon>
          Chart Settings
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="chartType"
                :items="chartTypeOptions"
                label="Chart Type"
                outlined
                dense
                @update:model-value="updateChart"
              ></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="startDate"
                :label="chartType === 'singleDate' ? 'Select Date' : 'Start Date'"
                type="date"
                outlined
                dense
                :max="endDate || new Date().toISOString().split('T')[0]"
                @update:model-value="updateChart"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="endDate"
                label="End Date"
                type="date"
                outlined
                dense
                :min="startDate"
                :max="new Date().toISOString().split('T')[0]"
                :disabled="chartType === 'singleDate'"
                @update:model-value="updateChart"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="selectedProducts"
                :items="availableProducts"
                label="Product Filter"
                placeholder="Select specific products"
                outlined
                dense
                multiple
                chips
                clearable
                @update:model-value="updateChart"
              ></v-combobox>
            </v-col>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="selectedStores"
                :items="availableStores"
                label="Store Filter"
                placeholder="Select specific stores"
                outlined
                dense
                multiple
                chips
                clearable
                @update:model-value="updateChart"
              ></v-combobox>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="text-right">
              <v-btn
                color="secondary"
                @click="resetFilters"
                class="mr-2"
              >
                <v-icon left>mdi-refresh</v-icon>
                Reset
              </v-btn>
              <v-btn
                color="primary"
                @click="loadChartData"
                :loading="loading"
              >
                <v-icon left>mdi-magnify</v-icon>
                Update Chart
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-2">Loading chart data...</div>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- No Data State -->
      <div v-else-if="chartData.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey">mdi-chart-line</v-icon>
        <div class="text-h6 mt-2">No chart data</div>
        <div class="text-body-2 text-grey">Please adjust filters or check data</div>
      </div>

      <!-- Chart -->
      <div v-else>
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon left>mdi-chart-box</v-icon>
            {{ chartTitle }}
          </v-card-title>
          <v-card-text>
            <div class="chart-container">
              <Line
                :data="chartConfig.data"
                :options="chartConfig.options"
                :height="400"
              />
            </div>
          </v-card-text>
        </v-card>

        <!-- Chart Statistics -->
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon left>mdi-chart-box</v-icon>
            Chart Statistics
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-card color="primary" variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-h6">{{ chartData.length }}</div>
                    <div class="text-caption">Data Points</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card color="success" variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-h6">${{ totalRevenue.toLocaleString() }}</div>
                    <div class="text-caption">Total Revenue</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card color="info" variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-h6">${{ averageRevenue.toFixed(2) }}</div>
                    <div class="text-caption">Average Revenue</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card color="warning" variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-h6">${{ maxRevenue.toLocaleString() }}</div>
                    <div class="text-caption">Peak Revenue</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { 
  fetchSalesHistory,
  fetchDistinctProducts, 
  fetchDistinctStoreNames
} from '../api/sales'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default {
  name: 'SellingHistoryChart',
  components: {
    Line
  },
  data() {
    return {
      chartData: [],
      loading: false,
      error: '',
      availableProducts: [],
      availableStores: [],
      chartType: 'dateRange',
      startDate: '',
      endDate: '',
      selectedProducts: [],
      selectedStores: [],
      chartTypeOptions: [
        { title: 'Date Range (Daily)', value: 'dateRange' },
        { title: 'Single Date (Hourly)', value: 'singleDate' }
      ]
    }
  },
  computed: {
    chartTitle() {
      if (this.chartType === 'singleDate') {
        return `Hourly Sales for ${this.startDate || 'Selected Date'}`
      }
      return `Daily Sales from ${this.startDate || 'Start'} to ${this.endDate || 'End'}`
    },
    totalRevenue() {
      return this.chartData.reduce((sum, item) => sum + (item.revenue || 0), 0)
    },
    averageRevenue() {
      if (this.chartData.length === 0) return 0
      return this.totalRevenue / this.chartData.length
    },
    maxRevenue() {
      if (this.chartData.length === 0) return 0
      return Math.max(...this.chartData.map(item => item.revenue || 0))
    },
    chartConfig() {
      const labels = this.chartData.map(item => {
        if (this.chartType === 'singleDate') {
          // For single date, show time
          return item.time || item.label
        } else {
          // For date range, show date
          return item.date || item.label
        }
      })
      
      const data = this.chartData.map(item => item.revenue || 0)
      
      return {
        data: {
          labels,
          datasets: [
            {
              label: 'Revenue ($)',
              data,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'rgb(75, 192, 192)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: this.chartTitle,
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return `Revenue: $${context.parsed.y.toLocaleString()}`
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: this.chartType === 'singleDate' ? 'Time' : 'Date'
              },
              grid: {
                display: true,
                color: 'rgba(0,0,0,0.1)'
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
                color: 'rgba(0,0,0,0.1)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString()
                }
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      }
    }
  },
  async mounted() {
    await this.loadFilterOptions()
    this.initializeDates()
    await this.loadChartData()
  },
  methods: {
    async loadFilterOptions() {
      try {
        const [products, stores] = await Promise.all([
          fetchDistinctProducts(),
          fetchDistinctStoreNames()
        ])
        
        this.availableProducts = products
        this.availableStores = stores
      } catch (error) {
        console.error('Failed to load filter options:', error)
        this.error = 'Failed to load filter options'
      }
    },
    
    initializeDates() {
      const today = new Date().toISOString().split('T')[0]
      this.endDate = today
      
      // Set default start date to 7 days ago
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      this.startDate = sevenDaysAgo.toISOString().split('T')[0]
    },
    
    async loadChartData() {
      this.loading = true
      this.error = ''
      
      try {
        const filters = this.buildFilters()
        const data = await fetchSalesHistory(filters)
        
        this.chartData = data || []
        
        if (this.chartData.length === 0) {
          this.error = 'No sales data found for the selected criteria'
        }
        
      } catch (error) {
        console.error('Failed to load chart data:', error)
        this.error = 'Failed to load chart data: ' + error.message
        this.chartData = []
      } finally {
        this.loading = false
      }
    },
    
    buildFilters() {
      const filters = {
        chartType: this.chartType
      }
      
      if (this.chartType === 'singleDate') {
        if (this.startDate) {
          filters.date = this.startDate
        }
      } else {
        if (this.startDate && this.endDate) {
          filters.dateRange = [this.startDate, this.endDate]
        }
      }
      
      if (this.selectedProducts.length > 0) {
        filters.products = this.selectedProducts
      }
      
      if (this.selectedStores.length > 0) {
        filters.stores = this.selectedStores
      }
      
      return filters
    },
    
    updateChart() {
      // Clear end date when switching to single date mode
      if (this.chartType === 'singleDate') {
        this.endDate = ''
      }
      // Auto-update chart when filters change
      this.loadChartData()
    },
    
    resetFilters() {
      this.chartType = 'dateRange'
      this.selectedProducts = []
      this.selectedStores = []
      this.initializeDates()
      this.loadChartData()
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

.v-card {
  border-radius: 12px;
}

.v-card-title {
  padding: 16px 24px;
}

.v-card-text {
  padding: 24px;
}
</style>
