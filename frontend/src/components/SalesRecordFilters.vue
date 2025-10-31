<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon left>mdi-filter</v-icon>
      Filter Conditions
      <v-spacer></v-spacer>
      <v-btn
        icon
        size="small"
        variant="text"
        @click="toggleFold"
      >
        <v-icon>{{ isFolded ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-show="!isFolded">
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
        
        <!-- Two Days Selection -->
        <v-col cols="12" md="8" v-if="dateFilterType === 'two-days'">
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="firstDate"
                label="Start Date"
                type="date"
                outlined
                dense
                :max="new Date().toISOString().split('T')[0]"
                @update:model-value="onTwoDaysChange"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="secondDate"
                label="End Date"
                type="date"
                outlined
                dense
                :max="new Date().toISOString().split('T')[0]"
                @update:model-value="onTwoDaysChange"
              ></v-text-field>
            </v-col>
          </v-row>
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
        { title: 'Select Day Range', value: 'two-days' }
      ],
      firstDate: null,
      secondDate: null,
      selectedProducts: [],
      selectedStoreNames: [],
      availableProducts: [],
      availableStoreNames: [],
      loadingProducts: false,
      loadingStoreNames: false,
      loading: false,
      isFolded: false
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
        
        // Map database values to display values with proper capitalization
        this.availableProducts = products.map(product => {
          if (product.toLowerCase() === 'iphone') return 'iPhone'
          if (product.toLowerCase() === 'ipad') return 'iPad'
          return product
        })
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
    
    onTwoDaysChange() {
      this.onFiltersChange()
    },
    
    formatDate(date) {
      if (!date) return ''
      const dateObj = new Date(date)
      // Use local timezone, no need to manually add offset
      return dateObj.toLocaleDateString('en-US')
    },
    
    onFiltersChange() {
      // Real-time filter change notification
      this.emitFilters()
    },
    
    emitFilters() {
      // Convert display values back to database values for products
      const dbProducts = this.selectedProducts.map(displayProduct => {
        if (displayProduct === 'iPhone') return 'iphone'
        if (displayProduct === 'iPad') return 'ipad'
        return displayProduct
      })
      
      const filters = {
        dateRange: this.getDateRangeFilter(),
        products: dbProducts,
        storeNames: this.selectedStoreNames
      }
      
      this.$emit('filters-change', filters)
    },
    
    getDateRangeFilter() {
      if (this.dateFilterType === 'two-days' && this.firstDate && this.secondDate) {
        // Validate date range validity
        const startDate = new Date(this.firstDate)
        const endDate = new Date(this.secondDate)
        
        if (startDate > endDate) {
          this.$emit('error', 'Start date cannot be later than end date')
          return null
        }
        
        // Return the two dates in chronological order
        const dates = [this.firstDate, this.secondDate].sort()
        return dates
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
      this.firstDate = null
      this.secondDate = null
      this.selectedProducts = []
      this.selectedStoreNames = []
      this.emitFilters()
    },
    
    resetDateFilters() {
      this.firstDate = null
      this.secondDate = null
    },
    
    toggleFold() {
      this.isFolded = !this.isFolded
    }
  }
}
</script>

<style scoped>
.v-date-picker {
  margin: 0 auto;
}
</style>
