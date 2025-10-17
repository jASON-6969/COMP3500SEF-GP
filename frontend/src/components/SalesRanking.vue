<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon left color="primary">mdi-trophy</v-icon>
      Sales Ranking
      <v-spacer></v-spacer>
      <v-chip color="primary" variant="outlined">
        {{ totalProducts }} Products
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <!-- Filters -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-1">
          <v-icon left>mdi-filter</v-icon>
          Ranking Filters
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="rankingFilters.sortBy"
                :items="sortOptions"
                label="Sort By"
                outlined
                dense
                @update:model-value="onFiltersChange"
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="rankingFilters.startDate"
                label="Start Date"
                type="date"
                outlined
                dense
                :max="rankingFilters.endDate || new Date().toISOString().split('T')[0]"
                @update:model-value="onFiltersChange"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="rankingFilters.endDate"
                label="End Date"
                type="date"
                outlined
                dense
                :min="rankingFilters.startDate"
                :max="new Date().toISOString().split('T')[0]"
                @update:model-value="onFiltersChange"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="rankingFilters.limit"
                label="Display Count"
                type="number"
                outlined
                dense
                min="1"
                max="100"
                @update:model-value="onFiltersChange"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="rankingFilters.products"
                :items="availableProducts"
                label="Product Filter"
                placeholder="Select specific products"
                outlined
                dense
                multiple
                chips
                clearable
                @update:model-value="onFiltersChange"
              ></v-combobox>
            </v-col>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="rankingFilters.stores"
                :items="availableStores"
                label="Store Filter"
                placeholder="Select specific stores"
                outlined
                dense
                multiple
                chips
                clearable
                @update:model-value="onFiltersChange"
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
                @click="loadRankingData"
                :loading="loading"
              >
                <v-icon left>mdi-magnify</v-icon>
                Update Ranking
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-2">Loading ranking data...</div>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- No Data State -->
      <div v-else-if="rankingData.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey">mdi-trophy-outline</v-icon>
        <div class="text-h6 mt-2">No ranking data</div>
        <div class="text-body-2 text-grey">Please adjust filters or check data</div>
      </div>

      <!-- Ranking List -->
      <div v-else>
        <v-list>
          <v-list-item
            v-for="(item, index) in rankingData"
            :key="item.product"
            class="mb-2"
            :class="getRankingItemClass(index)"
          >
            <template v-slot:prepend>
              <v-avatar
                :color="getRankingColor(index)"
                size="40"
                class="font-weight-bold"
              >
                {{ index + 1 }}
              </v-avatar>
            </template>
            
            <v-list-item-title class="text-h6">
              {{ capitalizeFirstLetter(item.product) }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              <v-row no-gutters>
                <v-col cols="12" md="3">
                  <v-icon small class="mr-1">mdi-cash</v-icon>
                  <span class="font-weight-bold text-success">
                    ${{ item.totalRevenue.toLocaleString() }}
                  </span>
                  <div class="text-caption">Total Revenue</div>
                </v-col>
                <v-col cols="12" md="3">
                  <v-icon small class="mr-1">mdi-package-variant</v-icon>
                  <span class="font-weight-bold text-primary">
                    {{ item.totalQuantity }}
                  </span>
                  <div class="text-caption">Total Quantity</div>
                </v-col>
                <v-col cols="12" md="3">
                  <v-icon small class="mr-1">mdi-store</v-icon>
                  <span class="font-weight-bold text-info">
                    {{ item.storeCount }}
                  </span>
                  <div class="text-caption">Store Count</div>
                </v-col>
                <v-col cols="12" md="3">
                  <v-icon small class="mr-1">mdi-chart-line</v-icon>
                  <span class="font-weight-bold text-warning">
                    ${{ item.averagePrice.toFixed(2) }}
                  </span>
                  <div class="text-caption">Average Price</div>
                </v-col>
              </v-row>
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-chip
                :color="getRankingColor(index)"
                variant="outlined"
                size="small"
              >
                <v-icon start>mdi-trophy</v-icon>
                {{ getRankingText(index) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <!-- Statistics -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="text-subtitle-1">
            <v-icon left>mdi-chart-box</v-icon>
            Ranking Statistics
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-card color="primary" variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-h6">{{ rankingData.length }}</div>
                    <div class="text-caption">Ranked Products</div>
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
                    <div class="text-h6">{{ totalQuantity }}</div>
                    <div class="text-caption">Total Quantity</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card color="warning" variant="tonal">
                  <v-card-text class="text-center">
                    <div class="text-h6">${{ averagePrice.toFixed(2) }}</div>
                    <div class="text-caption">Average Price</div>
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
import { 
  fetchDistinctProducts, 
  fetchDistinctStoreNames,
  fetchSalesRanking
} from '../api/sales'
import { capitalizeFirstLetter } from '../lib/textUtils'

export default {
  name: 'SalesRanking',
  data() {
    return {
      rankingData: [],
      loading: false,
      error: '',
      totalProducts: 0,
      availableProducts: [],
      availableStores: [],
      rankingFilters: {
        sortBy: 'revenue',
        startDate: '',
        endDate: '',
        limit: 10,
        products: [],
        stores: []
      },
      sortOptions: [
        { title: 'Sort by Revenue', value: 'revenue' },
        { title: 'Sort by Quantity', value: 'quantity' },
        { title: 'Sort by Store Count', value: 'stores' },
        { title: 'Sort by Average Price', value: 'price' }
      ]
    }
  },
  computed: {
    totalRevenue() {
      return this.rankingData.reduce((sum, item) => sum + item.totalRevenue, 0)
    },
    totalQuantity() {
      return this.rankingData.reduce((sum, item) => sum + item.totalQuantity, 0)
    },
    averagePrice() {
      if (this.rankingData.length === 0) return 0
      return this.totalRevenue / this.totalQuantity
    }
  },
  async mounted() {
    await this.loadFilterOptions()
    await this.loadRankingData()
  },
  methods: {
    capitalizeFirstLetter,
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
    
    async loadRankingData() {
      this.loading = true
      this.error = ''
      
      try {
        const filters = this.buildFilters()
        const data = await fetchSalesRanking(filters)
        
        this.rankingData = data.ranking || []
        this.totalProducts = data.total || 0
        
        if (this.rankingData.length === 0) {
          this.error = 'No products found matching the criteria'
        }
        
      } catch (error) {
        console.error('Failed to load ranking data:', error)
        this.error = 'Failed to load ranking data: ' + error.message
        this.rankingData = []
        this.totalProducts = 0
      } finally {
        this.loading = false
      }
    },
    
    buildFilters() {
      const filters = {
        sortBy: this.rankingFilters.sortBy,
        limit: parseInt(this.rankingFilters.limit) || 10
      }
      
      if (this.rankingFilters.startDate && this.rankingFilters.endDate) {
        filters.dateRange = [this.rankingFilters.startDate, this.rankingFilters.endDate]
      }
      
      if (this.rankingFilters.products.length > 0) {
        filters.products = this.rankingFilters.products
      }
      
      if (this.rankingFilters.stores.length > 0) {
        filters.stores = this.rankingFilters.stores
      }
      
      return filters
    },
    
    onFiltersChange() {
      // Update ranking in real-time
      this.loadRankingData()
    },
    
    resetFilters() {
      this.rankingFilters = {
        sortBy: 'revenue',
        startDate: '',
        endDate: '',
        limit: 10,
        products: [],
        stores: []
      }
      this.loadRankingData()
    },
    
    getRankingColor(index) {
      if (index === 0) return 'amber'
      if (index === 1) return 'grey'
      if (index === 2) return 'orange'
      return 'primary'
    },
    
    getRankingText(index) {
      if (index === 0) return 'Champion'
      if (index === 1) return 'Runner-up'
      if (index === 2) return 'Third Place'
      return `#${index + 1}`
    },
    
    getRankingItemClass(index) {
      if (index < 3) return 'ranking-top'
      return ''
    }
  }
}
</script>

<style scoped>
.ranking-top {
  border-left: 4px solid #ff9800;
  background-color: rgba(255, 152, 0, 0.05);
}

.v-list-item {
  border-radius: 8px;
  margin-bottom: 8px;
}

.v-avatar {
  font-size: 1.1rem;
}
</style>
