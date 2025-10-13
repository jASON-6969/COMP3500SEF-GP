<template>
  <v-card>
    <v-card-title>
      <v-icon left>mdi-format-list-bulleted</v-icon>
      Sales Records
      <v-spacer></v-spacer>
      <v-chip color="primary" variant="outlined">
        Total {{ totalRecords }} Records
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <!-- Statistics -->
      <v-row class="mb-4" v-if="stats">
        <v-col cols="12" md="3">
          <v-card color="primary" variant="tonal">
            <v-card-text class="text-center">
              <div class="text-h6">{{ stats.totalRecords }}</div>
              <div class="text-caption">Total Records</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="success" variant="tonal">
            <v-card-text class="text-center">
              <div class="text-h6">${{ stats.totalRevenue.toLocaleString() }}</div>
              <div class="text-caption">Total Revenue</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="info" variant="tonal">
            <v-card-text class="text-center">
              <div class="text-h6">{{ stats.totalQuantity }}</div>
              <div class="text-caption">Total Quantity</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="warning" variant="tonal">
            <v-card-text class="text-center">
              <v-btn
                color="warning"
                variant="elevated"
                @click="showRevenueChart"
                :disabled="!stats.dailyRevenue || stats.dailyRevenue.length === 0"
              >
                <v-icon left>mdi-chart-line</v-icon>
                Show Revenue
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-2">Loading...</div>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- No Data State -->
      <div v-else-if="salesRecords.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey">mdi-inbox-outline</v-icon>
        <div class="text-h6 mt-2">No Sales Records Found</div>
        <div class="text-body-2 text-grey">Please adjust filter conditions or check data</div>
      </div>

      <!-- Sales Records List -->
      <div v-else>
        <v-expansion-panels v-model="expandedPanels" multiple>
          <v-expansion-panel
            v-for="(record, index) in paginatedRecords"
            :key="record.id || index"
            :value="index"
          >
            <v-expansion-panel-title>
              <template v-slot:default="{ expanded }">
                <v-row no-gutters>
                  <v-col cols="12" md="3">
                    <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
                    <span class="ml-2">{{ record.product }}</span>
                  </v-col>
                  <v-col cols="12" md="2">
                    <span class="text-caption text-grey">Store:</span>
                    <div class="font-weight-medium">{{ record.name }}</div>
                  </v-col>
                  <v-col cols="12" md="2">
                    <span class="text-caption text-grey">Qty:</span>
                    <div class="font-weight-medium">{{ record.quantity }}</div>
                  </v-col>
                  <v-col cols="12" md="2">
                    <span class="text-caption text-grey">Unit:</span>
                    <div class="font-weight-medium">${{ record.unit_price }}</div>
                  </v-col>
                  <v-col cols="12" md="2">
                    <span class="text-caption text-grey">Total:</span>
                    <div class="font-weight-bold text-primary">${{ record.price }}</div>
                  </v-col>
                  <v-col cols="12" md="1">
                    <span class="text-caption text-grey">Time:</span>
                    <div class="text-caption">{{ formatDate(record.time) }}</div>
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <v-divider class="mb-3"></v-divider>
              
              <v-row>
                <v-col cols="12" md="6">
                  <v-list density="compact">
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-store</v-icon>
                      </template>
                      <v-list-item-title>Store Name</v-list-item-title>
                      <v-list-item-subtitle>{{ record.name }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-map-marker</v-icon>
                      </template>
                      <v-list-item-title>Store Location</v-list-item-title>
                      <v-list-item-subtitle>{{ record.store_location }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-package-variant</v-icon>
                      </template>
                      <v-list-item-title>Product</v-list-item-title>
                      <v-list-item-subtitle>{{ record.product }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-palette</v-icon>
                      </template>
                      <v-list-item-title>Color</v-list-item-title>
                      <v-list-item-subtitle>{{ record.color }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-list density="compact">
                    <v-list-item v-if="record.storage">
                      <template v-slot:prepend>
                        <v-icon>mdi-memory</v-icon>
                      </template>
                      <v-list-item-title>Storage</v-list-item-title>
                      <v-list-item-subtitle>{{ record.storage }}GB</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-numeric</v-icon>
                      </template>
                      <v-list-item-title>Quantity</v-list-item-title>
                      <v-list-item-subtitle>{{ record.quantity }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-currency-usd</v-icon>
                      </template>
                      <v-list-item-title>Unit Price</v-list-item-title>
                      <v-list-item-subtitle>${{ record.unit_price }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-calculator</v-icon>
                      </template>
                      <v-list-item-title>Total Price</v-list-item-title>
                      <v-list-item-subtitle class="text-h6 text-primary">${{ record.price }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
              
              <v-divider class="mt-3"></v-divider>
              
              <v-row class="mt-2">
                <v-col cols="12" class="text-right">
                  <v-chip color="grey" variant="outlined" size="small">
                    <v-icon start>mdi-clock</v-icon>
                    Sale Time: {{ formatDateTime(record.time) }}
                  </v-chip>
                  <v-chip color="grey" variant="outlined" size="small" class="ml-2">
                    <v-icon start>mdi-identifier</v-icon>
                    ID: {{ record.id }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        
        <!-- Pagination -->
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          class="mt-4"
          @update:model-value="onPageChange"
        >        </v-pagination>
      </div>
    </v-card-text>

    <!-- Revenue Chart Dialog -->
    <v-dialog v-model="showChartDialog" max-width="1200px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left color="primary">mdi-chart-line</v-icon>
          Revenue Analysis
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showChartDialog = false"
          ></v-btn>
        </v-card-title>
        <v-card-text>
          <!-- Date Range Selector for Revenue Analysis -->
          <v-card class="mb-4" variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon left>mdi-calendar-range</v-icon>
              Date Range Filter
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="revenueDateRange.startDate"
                    label="Start Date"
                    type="date"
                    prepend-icon="mdi-calendar-start"
                    variant="outlined"
                    density="compact"
                    :max="revenueDateRange.endDate || new Date().toISOString().split('T')[0]"
                    @update:model-value="onRevenueDateRangeChange"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="revenueDateRange.endDate"
                    label="End Date"
                    type="date"
                    prepend-icon="mdi-calendar-end"
                    variant="outlined"
                    density="compact"
                    :min="revenueDateRange.startDate"
                    :max="new Date().toISOString().split('T')[0]"
                    @update:model-value="onRevenueDateRangeChange"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4" class="d-flex align-center">
                  <v-btn
                    color="primary"
                    variant="outlined"
                    @click="applyRevenueDateRange"
                    :disabled="!revenueDateRange.startDate || !revenueDateRange.endDate"
                    class="mr-2"
                  >
                    <v-icon left>mdi-filter</v-icon>
                    Apply Filter
                  </v-btn>
                  <v-btn
                    color="secondary"
                    variant="text"
                    @click="clearRevenueDateRange"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    Clear
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          
          <v-tabs v-model="activeTab" class="mb-4">
            <v-tab value="daily">Daily Revenue</v-tab>
            <v-tab value="monthly">Monthly Revenue</v-tab>
          </v-tabs>
          
          <v-tabs-window v-model="activeTab">
            <v-tabs-window-item value="daily">
              <div v-if="filteredDailyRevenue && filteredDailyRevenue.length > 0">
                <RevenueChart
                  :data="filteredDailyRevenue"
                  :type="'daily'"
                  :title="'Daily Revenue Trend'"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-chart-line</v-icon>
                <div class="text-h6 mt-2">No Daily Revenue Data</div>
                <div class="text-body-2 text-grey">No sales data available for daily analysis</div>
              </div>
            </v-tabs-window-item>
            
            <v-tabs-window-item value="monthly">
              <div v-if="filteredMonthlyRevenue && filteredMonthlyRevenue.length > 0">
                <RevenueChart
                  :data="filteredMonthlyRevenue"
                  :type="'monthly'"
                  :title="'Monthly Revenue Trend'"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-chart-line</v-icon>
                <div class="text-h6 mt-2">No Monthly Revenue Data</div>
                <div class="text-body-2 text-grey">No sales data available for monthly analysis</div>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import RevenueChart from './RevenueChart.vue'

export default {
  name: 'SalesRecordList',
  components: {
    RevenueChart
  },
  props: {
    salesRecords: {
      type: Array,
      default: () => []
    },
    stats: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 20,
      expandedPanels: [],
      showChartDialog: false,
      activeTab: 'daily',
      revenueDateRange: {
        startDate: '',
        endDate: ''
      }
    }
  },
  computed: {
    totalRecords() {
      return this.salesRecords.length
    },
    totalPages() {
      return Math.ceil(this.totalRecords / this.itemsPerPage)
    },
    paginatedRecords() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.salesRecords.slice(start, end)
    },
    filteredSalesRecords() {
      if (!this.revenueDateRange.startDate || !this.revenueDateRange.endDate) {
        return this.salesRecords
      }
      
      const startDate = new Date(this.revenueDateRange.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(this.revenueDateRange.endDate)
      endDate.setHours(23, 59, 59, 999)
      
      return this.salesRecords.filter(record => {
        if (!record.time) return false
        const recordDate = new Date(record.time)
        return recordDate >= startDate && recordDate <= endDate
      })
    },
    filteredDailyRevenue() {
      if (!this.stats || !this.stats.dailyRevenue) {
        return []
      }
      
      if (!this.revenueDateRange.startDate || !this.revenueDateRange.endDate) {
        return this.stats.dailyRevenue
      }
      
      const startDate = new Date(this.revenueDateRange.startDate)
      const endDate = new Date(this.revenueDateRange.endDate)
      
      return this.stats.dailyRevenue.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate && itemDate <= endDate
      })
    },
    filteredMonthlyRevenue() {
      if (!this.stats || !this.stats.monthlyRevenue) {
        return []
      }
      
      if (!this.revenueDateRange.startDate || !this.revenueDateRange.endDate) {
        return this.stats.monthlyRevenue
      }
      
      const startDate = new Date(this.revenueDateRange.startDate)
      const endDate = new Date(this.revenueDateRange.endDate)
      
      return this.stats.monthlyRevenue.filter(item => {
        const [year, month] = item.month.split('-')
        const itemDate = new Date(year, month - 1, 1)
        return itemDate >= startDate && itemDate <= endDate
      })
    }
  },
  watch: {
    salesRecords() {
      // Reset to first page when records change
      this.currentPage = 1
      this.expandedPanels = []
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      // 添加8小时时区偏移，确保显示本地时间
      const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
      return localDate.toLocaleDateString('en-US')
    },
    
    formatDateTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      // 添加8小时时区偏移，确保显示本地时间
      const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
      return localDate.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    },
    
    onPageChange(page) {
      this.currentPage = page
      // Scroll to top
      this.$nextTick(() => {
        const element = this.$el.querySelector('.v-card')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      })
    },
    
    expandAll() {
      this.expandedPanels = Array.from({ length: this.paginatedRecords.length }, (_, i) => i)
    },
    
    collapseAll() {
      this.expandedPanels = []
    },
    
    showRevenueChart() {
      this.showChartDialog = true
      this.activeTab = 'daily'
    },
    
    onRevenueDateRangeChange() {
      // Auto-apply filter when both dates are selected
      if (this.revenueDateRange.startDate && this.revenueDateRange.endDate) {
        this.applyRevenueDateRange()
      }
    },
    
    applyRevenueDateRange() {
      // Force reactivity update
      this.$forceUpdate()
    },
    
    clearRevenueDateRange() {
      this.revenueDateRange.startDate = ''
      this.revenueDateRange.endDate = ''
      this.applyRevenueDateRange()
    }
  }
}
</script>

<style scoped>
.v-expansion-panel-title {
  font-size: 0.9rem;
}

.v-list-item {
  min-height: 36px;
}

.v-chip {
  font-size: 0.75rem;
}
</style>
