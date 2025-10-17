<template>
  <v-autocomplete
    :disabled="!product"
    :items="items"
    :loading="loading"
    :model-value="modelValue"
    label="Color"
    placeholder="Select a color"
    clearable
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script>
import { fetchColorsByProduct } from '../api/inventory'
export default {
  name: 'ColorSelector',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    store: { // kept for compatibility, unused in new flow
      type: Object,
      default: null
    },
    product: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      items: []
    }
  },
  watch: {
    product: {
      handler() { this.load() },
      immediate: true
    }
  },
  methods: {
    async load() {
      if (!this.product) {
        this.items = []
        return
      }
      this.loading = true
      try {
        const colors = await fetchColorsByProduct(this.product)
        this.items = (colors && colors.length) ? colors : ['(not available)']
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load colors', err)
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


