<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <!-- Page Title -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon left size="large" color="primary">mdi-chart-line</v-icon>
            <h1 class="text-h4">Sales Records Query</h1>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="outlined"
              @click="refreshData"
              :loading="isRefreshing"
            >
              <v-icon left>mdi-refresh</v-icon>
              Refresh Data
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 text-grey-darken-1">
              View and manage all sales records with filtering by date, product, and store
            </p>
          </v-card-text>
        </v-card>

        <!-- Filter Panel -->
        <SalesRecordFilters
          @filters-change="onFiltersChange"
          @error="onFilterError"
          class="mb-4"
        />

        <!-- Sales Ranking -->
        <SalesRanking class="mb-4" />

        <!-- Sales Records List -->
        <SalesRecordList
          :sales-records="salesRecords"
          :stats="salesStats"
          :loading="loading"
          :error="error"
        />
      </v-col>
    </v-row>

    <!-- Error Dialog -->
    <v-dialog v-model="showErrorDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 text-error">
          <v-icon left color="error">mdi-alert-circle</v-icon>
          Error
        </v-card-title>
        <v-card-text>
          {{ errorDialogMessage }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showErrorDialog = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import SalesRecordFilters from '../components/SalesRecordFilters.vue'
import SalesRecordList from '../components/SalesRecordList.vue'
import SalesRanking from '../components/SalesRanking.vue'
import { 
  fetchSalesWithFilters, 
  fetchSalesStats 
} from '../api/sales'

export default {
  name: 'SalesRecord',
  components: {
    SalesRecordFilters,
    SalesRecordList,
    SalesRanking
  },
  data() {
    return {
      salesRecords: [],
      salesStats: null,
      loading: false,
      isRefreshing: false,
      error: '',
      showErrorDialog: false,
      errorDialogMessage: '',
      currentFilters: {}
    }
  },
  async mounted() {
    // Initial load of all sales records
    await this.loadSalesData()
  },
  methods: {
    async onFiltersChange(filters) {
      this.currentFilters = filters
      await this.loadSalesData(filters)
    },
    
    async loadSalesData(filters = {}) {
      this.loading = true
      this.error = ''
      
      try {
        // Fetch sales records and statistics in parallel
        const [records, stats] = await Promise.all([
          fetchSalesWithFilters(filters),
          fetchSalesStats(filters)
        ])
        
        this.salesRecords = records
        this.salesStats = stats
        
        // If no records found, show message
        if (records.length === 0 && Object.keys(filters).length > 0) {
          this.error = 'No sales records found matching the criteria. Please try adjusting the filter conditions'
        }
        
      } catch (error) {
        console.error('Failed to load sales data:', error)
        this.error = 'Failed to load sales records: ' + error.message
        this.salesRecords = []
        this.salesStats = null
      } finally {
        this.loading = false
      }
    },
    
    async refreshData() {
      this.isRefreshing = true
      try {
        await this.loadSalesData(this.currentFilters)
      } finally {
        this.isRefreshing = false
      }
    },
    
    onFilterError(message) {
      this.errorDialogMessage = message
      this.showErrorDialog = true
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.text-grey-darken-1 {
  color: rgba(0, 0, 0, 0.6) !important;
}
</style>