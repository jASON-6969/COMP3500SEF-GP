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
              <div class="text-h6">${{ stats.averageOrderValue?.toLocaleString() || '0' }}</div>
              <div class="text-caption">Avg Order Value</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Selling History Chart -->
      <div class="mt-6">
        <SellingHistoryChart />
      </div>

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
                  <v-chip color="primary" variant="outlined" size="small" class="ml-2" v-if="record.order_id">
                    <v-icon start>mdi-receipt</v-icon>
                    Order ID: {{ record.order_id }}
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

  </v-card>
</template>

<script>
import SellingHistoryChart from './SellingHistoryChart.vue'

export default {
  name: 'SalesRecordList',
  components: {
    SellingHistoryChart
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
      expandedPanels: []
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
      // Add 8-hour timezone offset to ensure local time display
      const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
      return localDate.toLocaleDateString('en-US')
    },
    
    formatDateTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      // Add 8-hour timezone offset to ensure local time display
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
