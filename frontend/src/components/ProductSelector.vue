<template>
  <v-autocomplete
    :disabled="!store"
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
import { fetchProductsByStore } from '../api/inventory'

export default {
  name: 'ProductSelector',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    store: {
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
    store: {
      handler() {
        this.load()
      },
      immediate: true
    }
  },
  methods: {
    async load() {
      if (!this.store) {
        this.items = []
        return
      }
      this.loading = true
      try {
        const products = await fetchProductsByStore(this.store)
        this.items = products
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load products', err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

</style>


