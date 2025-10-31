<template>
  <div class="product-selector" :class="{ 'mb-4': !isSingleSelect }">
    <v-btn-toggle
      v-if="isReady"
      v-model="internalValue"
      :multiple="multipleMode"
      variant="outlined"
      color="primary"
      class="product-toggle-group"
    >
      <v-btn
        v-for="product in availableProducts"
        :key="product.value"
        :value="product.value"
        class="product-btn"
        @click="onProductChange"
      >
        {{ product.label }}
      </v-btn>
    </v-btn-toggle>
    <div v-if="loading" class="text-center pa-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-if="!loading && availableProducts.length === 0" class="text-center pa-4 text-grey">
      No products available
    </div>
  </div>
</template>

<script>
import { fetchDistinctProducts as fetchDistinctProductsSales } from '../api/sales'
import { fetchDistinctProducts as fetchDistinctProductsInventory } from '../api/inventory'

export default {
  name: 'ProductSelector',
  props: {
    modelValue: {
      type: String,
      default: undefined
    },
    multiple: {
      type: Boolean,
      default: undefined
    }
  },
  emits: ['update:modelValue', 'products-change'],
  data() {
    return {
      availableProducts: [],
      loading: false,
      selectedProductsList: [],
      isReady: false
    }
  },
  computed: {
    multipleMode() {
      // If multiple is explicitly set, use it
      if (this.multiple !== undefined) {
        return this.multiple
      }
      // Default detection:
      // - If modelValue is undefined (not provided via v-model), use multi-select mode
      // - If modelValue has any value (even '', null), v-model is being used, so single-select
      return this.modelValue === undefined
    },
    isSingleSelect() {
      return !this.multipleMode
    },
    internalValue: {
      get() {
        if (this.isSingleSelect) {
          return this.modelValue || null
        }
        // Always return an array for multi-select mode
        return Array.isArray(this.selectedProducts) ? this.selectedProducts : []
      },
      set(value) {
        if (this.isSingleSelect) {
          this.$emit('update:modelValue', value)
        } else {
          // Ensure value is always an array in multi-select mode
          this.selectedProducts = Array.isArray(value) ? value : []
        }
      }
    },
    selectedProducts: {
      get() {
        return this.selectedProductsList || []
      },
      set(value) {
        this.selectedProductsList = value
      }
    }
  },
  async mounted() {
    await this.loadProducts()
    // Only auto-select all products in multi-select mode (SalesRecord)
    if (!this.isSingleSelect && this.availableProducts.length > 0) {
      this.selectedProducts = this.availableProducts.map(p => p.value)
    }
    // Use nextTick to ensure data is fully reactive before rendering component
    await this.$nextTick()
    this.isReady = true
    // Emit products change after component is ready
    if (!this.isSingleSelect && this.availableProducts.length > 0) {
      this.emitProducts()
    }
  },
  methods: {
    async loadProducts() {
      this.loading = true
      try {
        // Use inventory API for single-select (Selling page), sales API for multi-select (SalesRecord)
        const products = this.isSingleSelect 
          ? await fetchDistinctProductsInventory()
          : await fetchDistinctProductsSales()
        
        // Map to display-friendly labels and group similar products
        const productMap = new Map()
        
        products.forEach(product => {
          const lowerProduct = product.toLowerCase()
          let key = ''
          let label = ''
          
          if (lowerProduct === 'iphone' || lowerProduct === 'phone') {
            key = 'iphone'
            label = 'iPhone'
          } else if (lowerProduct === 'ipad' || lowerProduct === 'pad') {
            key = 'ipad'
            label = 'iPad'
          } else if (lowerProduct.includes('headphone') || lowerProduct.includes('airpod') || lowerProduct.includes('earpod')) {
            key = 'headphone'
            label = 'Airpod'
          } else if (lowerProduct === 'macbook') {
            key = 'macbook'
            label = 'Macbook'
          } else {
            key = lowerProduct
            label = product
          }
          
          // For single-select mode (InventorySearchPanel), use actual product names
          // For multi-select mode (SalesRecord), group similar products
          if (this.isSingleSelect) {
            // In single-select mode, create entry with actual product value
            if (!productMap.has(product)) {
              productMap.set(product, {
                value: product, // Use actual product name for database queries
                label: label
              })
            }
          } else {
            // Multi-select mode - group similar products
            if (!productMap.has(key)) {
              productMap.set(key, {
                value: key,
                label: label,
                originalProducts: []
              })
            }
            // Store the original product name for database queries
            const dbProduct = lowerProduct === 'iphone' ? 'iphone' : 
                             lowerProduct === 'ipad' ? 'ipad' : 
                             product.toLowerCase()
            productMap.get(key).originalProducts.push(dbProduct)
          }
        })
        
        this.availableProducts = Array.from(productMap.values())
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        this.loading = false
      }
    },
    
    onProductChange() {
      if (this.isSingleSelect) {
        // Single-select mode - already handled by v-model
        return
      }
      // Multi-select mode
      this.emitProducts()
    },
    
    emitProducts() {
      // Only for multi-select mode (SalesRecord)
      if (this.isSingleSelect) return
      
      // Convert selected keys to actual database product values
      const dbProducts = []
      
      this.selectedProducts.forEach(selectedKey => {
        const productInfo = this.availableProducts.find(p => p.value === selectedKey)
        if (productInfo) {
          // Add all original products for this category
          dbProducts.push(...productInfo.originalProducts)
        }
      })
      
      this.$emit('products-change', dbProducts.length > 0 ? dbProducts : null)
    }
  }
}
</script>

<style scoped>
.product-selector {
  width: 100%;
}

.product-toggle-group {
  width: 100%;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.product-btn {
  flex: 1;
  min-width: 100px;
  border-radius: 20px !important;
  text-transform: none;
  font-weight: 500;
  padding: 8px 16px;
}

.product-btn.v-btn--selected {
  background-color: rgba(var(--v-theme-primary), 0.12) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
