<template>
  <v-autocomplete
    :disabled="false"
    :items="items"
    :loading="loading"
    :model-value="modelValue"
    label="Product"
    placeholder="Select a product"
    clearable
    @update:model-value="$emit('update:modelValue', $event)"
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
      items: []
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
        this.items = products.length > 0 ? products : ['(not available)']
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load products', err)
        this.items = ['(not available)']
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

</style>


