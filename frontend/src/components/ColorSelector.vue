<template>
  <v-autocomplete
    :disabled="!store || !product"
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
import { fetchColorsByStoreAndProduct } from '../api/inventory'

export default {
  name: 'ColorSelector',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    store: {
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
    store: {
      handler() { this.load() },
      immediate: true
    },
    product() {
      this.load()
    }
  },
  methods: {
    async load() {
      if (!this.store || !this.product) {
        this.items = []
        return
      }
      this.loading = true
      try {
        const colors = await fetchColorsByStoreAndProduct(this.store, this.product)
        this.items = colors
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load colors', err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

</style>


