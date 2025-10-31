<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center pb-2">
      <v-icon left>mdi-cash-multiple</v-icon>
      Revenue Summary
      <v-spacer></v-spacer>
      <v-btn-toggle
        v-model="viewMode"
        mandatory
        variant="outlined"
        density="compact"
        @update:model-value="onViewModeChange"
      >
        <v-btn value="monthly" size="small">
          Monthly
        </v-btn>
        <v-btn value="daily" size="small">
          Daily
        </v-btn>
      </v-btn-toggle>
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <!-- Monthly/Daily Amount Card -->
        <v-col cols="12" md="6">
          <v-card 
            :color="viewMode === 'monthly' ? 'primary' : 'success'" 
            variant="tonal"
            class="income-card"
          >
            <v-card-text>
              <div class="text-caption text-grey-darken-1 mb-1">
                {{ viewMode === 'monthly' ? 'Monthly Amount' : 'Today Amount' }}
              </div>
              <div class="text-h4 font-weight-bold mb-2">
                ${{ currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </div>
              <div class="text-body-2" :class="percentageChange >= 0 ? 'text-success' : 'text-error'">
                <v-icon 
                  :icon="percentageChange >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                  size="small"
                  class="mr-1"
                ></v-icon>
                {{ Math.abs(percentageChange) }}% {{ comparisonText }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Additional Info Card -->
        <v-col cols="12" md="6">
          <v-card 
            color="info" 
            variant="tonal"
            class="income-card"
          >
            <v-card-text>
              <div class="text-caption text-grey-darken-1 mb-1">
                {{ viewMode === 'monthly' ? 'Monthly Quantity' : 'Daily Quantity' }}
              </div>
              <div class="text-h4 font-weight-bold mb-2">
                {{ currentQuantity.toLocaleString() }}
              </div>
              <div class="text-body-2 text-grey-darken-1">
                {{ viewMode === 'monthly' ? 'Total items sold this month' : 'Total items sold' }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'IncomeCards',
  props: {
    stats: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      viewMode: 'monthly',
      previousPeriodData: null
    }
  },
  computed: {
    currentAmount() {
      if (!this.stats) return 0
      
      if (this.viewMode === 'monthly') {
        // Get current month revenue
        if (!this.stats.monthlyRevenue || this.stats.monthlyRevenue.length === 0) {
          return 0
        }
        // Use UTC to match the API calculation
        const now = new Date()
        const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
        const currentMonthData = this.stats.monthlyRevenue.find(m => m.month === currentMonth)
        return currentMonthData?.revenue || 0
      } else {
        // Get today's revenue
        if (!this.stats.dailyRevenue || this.stats.dailyRevenue.length === 0) {
          return 0
        }
        // Use UTC to match the API calculation
        const today = new Date().toISOString().split('T')[0]
        const todayData = this.stats.dailyRevenue.find(d => d.date === today)
        return todayData?.revenue || 0
      }
    },
    
    percentageChange() {
      if (!this.previousPeriodData || !this.currentAmount) return 0
      
      if (this.previousPeriodData === 0) return this.currentAmount > 0 ? 100 : 0
      
      const change = ((this.currentAmount - this.previousPeriodData) / this.previousPeriodData) * 100
      return Math.round(change * 10) / 10
    },
    
    comparisonText() {
      if (this.viewMode === 'monthly') {
        return 'month over month'
      } else {
        return 'compare to yesterday'
      }
    },
    
    todaySales() {
      if (!this.stats || !this.stats.dailyRevenue || this.stats.dailyRevenue.length === 0) return 0
      const today = new Date().toISOString().split('T')[0]
      const todayData = this.stats.dailyRevenue.find(d => d.date === today)
      return todayData?.revenue || 0
    },
    
    todayGrowth() {
      if (!this.stats || !this.stats.dailyRevenue || this.stats.dailyRevenue.length === 0) return 0
      
      // Use UTC to match the API calculation
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const yesterday = new Date(today)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      const todayData = this.stats.dailyRevenue.find(d => d.date === todayStr)
      const yesterdayData = this.stats.dailyRevenue.find(d => d.date === yesterdayStr)
      
      if (!todayData || !yesterdayData || yesterdayData.revenue === 0) {
        return todayData?.revenue > 0 ? 100 : 0
      }
      
      const growth = ((todayData.revenue - yesterdayData.revenue) / yesterdayData.revenue) * 100
      return Math.round(growth)
    },
    
    currentQuantity() {
      if (!this.stats) return 0
      
      if (this.viewMode === 'monthly') {
        // Get current month quantity
        if (!this.stats.monthlyQuantity || this.stats.monthlyQuantity.length === 0) {
          return 0
        }
        // Use UTC to match the API calculation
        const now = new Date()
        const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
        const currentMonthData = this.stats.monthlyQuantity.find(m => m.month === currentMonth)
        return currentMonthData?.quantity || 0
      } else {
        // Get today's quantity from dailyQuantity array
        if (!this.stats.dailyQuantity || this.stats.dailyQuantity.length === 0) {
          return 0
        }
        // Use UTC to match the API calculation
        const today = new Date().toISOString().split('T')[0]
        const todayData = this.stats.dailyQuantity.find(d => d.date === today)
        return todayData?.quantity || 0
      }
    }
  },
  watch: {
    stats: {
      immediate: true,
      handler() {
        this.calculatePreviousPeriod()
      }
    },
    
    viewMode() {
      this.calculatePreviousPeriod()
    }
  },
  methods: {
    calculatePreviousPeriod() {
      if (!this.stats) {
        this.previousPeriodData = null
        return
      }
      
      if (this.viewMode === 'monthly') {
        // Compare with previous month
        if (!this.stats.monthlyRevenue || this.stats.monthlyRevenue.length === 0) {
          this.previousPeriodData = 0
          return
        }
        // Use UTC to match the API calculation
        const now = new Date()
        const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
        const prevMonthKey = `${prevMonth.getUTCFullYear()}-${String(prevMonth.getUTCMonth() + 1).padStart(2, '0')}`
        const prevMonthData = this.stats.monthlyRevenue.find(m => m.month === prevMonthKey)
        this.previousPeriodData = prevMonthData?.revenue || 0
      } else {
        // Compare with yesterday
        if (!this.stats.dailyRevenue || this.stats.dailyRevenue.length === 0) {
          this.previousPeriodData = 0
          return
        }
        // Use UTC to match the API calculation
        const yesterday = new Date()
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        const yesterdayData = this.stats.dailyRevenue.find(d => d.date === yesterdayStr)
        this.previousPeriodData = yesterdayData?.revenue || 0
      }
    },
    
    onViewModeChange() {
      this.calculatePreviousPeriod()
    }
  }
}
</script>

<style scoped>
.income-card {
  height: 100%;
  min-height: 120px;
}

.v-card-text {
  padding: 16px;
}
</style>

