<template>
  <v-autocomplete
    :items="storeItems"
    :loading="loading"
    :model-value="modelValue"
    item-title="label"
    item-value="value"
    label="Store"
    placeholder="Select a store"
    clearable
    @update:model-value="onUpdate"
  />
</template>

<script>
import { fetchDistinctStores } from '../api/inventory'

export default {
  name: 'StoreSelector',
  props: {
    modelValue: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      storeItems: []
    }
  },
  methods: {
    onUpdate(val) {
      this.$emit('update:modelValue', val)
    },
    async loadStores() {
      this.loading = true
      try {
        const stores = await fetchDistinctStores()
        this.storeItems = stores.map(s => ({
          label: s.label,
          value: { name: s.name, location: s.location }
        }))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load stores', err)
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.loadStores()
  }
}
</script>

<style scoped>

</style>


