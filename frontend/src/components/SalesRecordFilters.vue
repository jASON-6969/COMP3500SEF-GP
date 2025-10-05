<template>
  <v-card>
    <v-card-title>
      <v-icon left>mdi-filter</v-icon>
      Filter Conditions
    </v-card-title>
    <v-card-text>
      <v-row>
        <!-- Date Filter -->
        <v-col cols="12" md="4">
          <v-select
            v-model="dateFilterType"
            :items="dateFilterOptions"
            label="Date Filter Type"
            outlined
            dense
            @change="onDateFilterTypeChange"
          ></v-select>
        </v-col>
        
        <!-- Single Date Selection -->
        <v-col cols="12" md="4" v-if="dateFilterType === 'single'">
          <v-date-picker
            v-model="singleDate"
            @update:model-value="onDateChange"
            color="primary"
            show-adjacent-months
            :max="new Date().toISOString().split('T')[0]"
          ></v-date-picker>
        </v-col>
        
        <!-- Date Range Selection -->
        <v-col cols="12" md="4" v-if="dateFilterType === 'range'">
          <v-text-field
            v-model="dateRangeText"
            label="Date Range"
            placeholder="Select start and end date"
            outlined
            dense
            readonly
            append-icon="mdi-calendar"
            @click="showDateRangePicker = true"
          ></v-text-field>
        </v-col>
        
        <!-- Product Filter -->
        <v-col cols="12" md="4">
          <v-combobox
            v-model="selectedProducts"
            :items="availableProducts"
            :loading="loadingProducts"
            label="Product Filter"
            placeholder="Select products"
            outlined
            dense
            multiple
            chips
            clearable
            @update:model-value="onFiltersChange"
          ></v-combobox>
        </v-col>
        
        <!-- Store Name Filter -->
        <v-col cols="12" md="4">
          <v-combobox
            v-model="selectedStoreNames"
            :items="availableStoreNames"
            :loading="loadingStoreNames"
            label="Store Filter"
            placeholder="Select stores"
            outlined
            dense
            multiple
            chips
            clearable
            @update:model-value="onFiltersChange"
          ></v-combobox>
        </v-col>
      </v-row>
      
      <!-- Action Buttons -->
      <v-row class="mt-2">
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
            @click="applyFilters"
            :loading="loading"
          >
            <v-icon left>mdi-magnify</v-icon>
            Search
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    
    <!-- Date Range Picker Dialog -->
    <v-dialog v-model="showDateRangePicker" max-width="400px">
      <v-card>
        <v-card-title>Select Date Range</v-card-title>
        <v-card-text>
          <v-date-picker
            v-model="dateRange"
            range
            @update:model-value="onDateRangeChange"
            color="primary"
            show-adjacent-months
            :max="new Date().toISOString().split('T')[0]"
          ></v-date-picker>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDateRangePicker = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmDateRange">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { 
  fetchDistinctProducts, 
  fetchDistinctStoreNames 
} from '../api/sales'

export default {
  name: 'SalesRecordFilters',
  emits: ['filters-change'],
  data() {
    return {
      dateFilterType: 'none',
      dateFilterOptions: [
        { title: 'No Date Filter', value: 'none' },
        { title: 'Select Single Date', value: 'single' },
        { title: 'Select Date Range', value: 'range' }
      ],
      singleDate: null,
      dateRange: [],
      dateRangeText: '',
      showDateRangePicker: false,
      selectedProducts: [],
      selectedStoreNames: [],
      availableProducts: [],
      availableStoreNames: [],
      loadingProducts: false,
      loadingStoreNames: false,
      loading: false
    }
  },
  mounted() {
    this.loadFilterOptions()
  },
  methods: {
    async loadFilterOptions() {
      // Load product and store options in parallel
      this.loadingProducts = true
      this.loadingStoreNames = true
      
      try {
        const [products, storeNames] = await Promise.all([
          fetchDistinctProducts(),
          fetchDistinctStoreNames()
        ])
        
        this.availableProducts = products
        this.availableStoreNames = storeNames
      } catch (error) {
        console.error('Failed to load filter options:', error)
        this.$emit('error', 'Failed to load filter options')
      } finally {
        this.loadingProducts = false
        this.loadingStoreNames = false
      }
    },
    
    onDateFilterTypeChange() {
      this.resetDateFilters()
      this.onFiltersChange()
    },
    
    onDateChange() {
      this.onFiltersChange()
    },
    
    onDateRangeChange() {
      // Handle date range changes
    },
    
    confirmDateRange() {
      if (this.dateRange && this.dateRange.length > 0) {
        if (this.dateRange.length === 1) {
          this.dateRangeText = this.formatDate(this.dateRange[0])
        } else if (this.dateRange.length === 2) {
          this.dateRangeText = `${this.formatDate(this.dateRange[0])} - ${this.formatDate(this.dateRange[1])}`
        }
      }
      this.showDateRangePicker = false
      this.onFiltersChange()
    },
    
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-US')
    },
    
    onFiltersChange() {
      // Real-time filter change notification
      this.emitFilters()
    },
    
    emitFilters() {
      const filters = {
        dateRange: this.getDateRangeFilter(),
        products: this.selectedProducts,
        storeNames: this.selectedStoreNames
      }
      
      this.$emit('filters-change', filters)
    },
    
    getDateRangeFilter() {
      if (this.dateFilterType === 'single' && this.singleDate) {
        return [this.singleDate]
      } else if (this.dateFilterType === 'range' && this.dateRange.length > 0) {
        return this.dateRange
      }
      return null
    },
    
    applyFilters() {
      this.loading = true
      this.emitFilters()
      
      // Simulate loading state
      setTimeout(() => {
        this.loading = false
      }, 500)
    },
    
    resetFilters() {
      this.dateFilterType = 'none'
      this.singleDate = null
      this.dateRange = []
      this.dateRangeText = ''
      this.selectedProducts = []
      this.selectedStoreNames = []
      this.emitFilters()
    },
    
    resetDateFilters() {
      this.singleDate = null
      this.dateRange = []
      this.dateRangeText = ''
    }
  }
}
</script>

<style scoped>
.v-date-picker {
  margin: 0 auto;
}
</style>
