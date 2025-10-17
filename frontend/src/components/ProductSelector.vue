<template>
  <v-autocomplete
    :disabled="false"
    :items="items"
    :loading="loading"
    :model-value="displayValue"
    label="Product"
    placeholder="Select a product"
    clearable
    @update:model-value="onSelectionChange"
  />
  
</template>

<script>
import { fetchDistinctProducts } from '../api/inventory'

export default {
  name: 'ProductSelector',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    store: { // kept for compatibility, unused in new flow
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      items: [],
      productMapping: {} // Maps display names to database values
    }
  },
  computed: {
    displayValue() {
      // Convert database value to display value
      if (this.modelValue.toLowerCase() === 'iphone') return 'iPhone'
      if (this.modelValue.toLowerCase() === 'ipad') return 'iPad'
      return this.modelValue
    }
  },
  watch: {
    modelValue() {},
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const products = await fetchDistinctProducts()
        // Map database values to display values with proper capitalization
        this.items = products.map(product => {
          if (product.toLowerCase() === 'iphone') return 'iPhone'
          if (product.toLowerCase() === 'ipad') return 'iPad'
          return product
        })
        
        // Create mapping for conversion
        this.productMapping = {}
        products.forEach(product => {
          if (product.toLowerCase() === 'iphone') {
            this.productMapping['iPhone'] = product
          } else if (product.toLowerCase() === 'ipad') {
            this.productMapping['iPad'] = product
          } else {
            this.productMapping[product] = product
          }
        })
        
        if (this.items.length === 0) {
          this.items = ['(not available)']
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load products', err)
        this.items = ['(not available)']
      } finally {
        this.loading = false
      }
    },
    
    onSelectionChange(displayValue) {
      // Convert display value back to database value
      const dbValue = this.productMapping[displayValue] || displayValue
      this.$emit('update:modelValue', dbValue)
    }
  }
}
</script>

<style scoped>

</style>


