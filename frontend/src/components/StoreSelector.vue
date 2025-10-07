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
  >
    <template #item="{ props, item }">
      <v-list-item
        v-bind="props"
        :disabled="item?.raw?.notAvailable === true"
        :class="item?.raw?.notAvailable ? 'text-disabled' : ''"
      >
        <v-list-item-title>
          {{ item?.raw?.label }}
        </v-list-item-title>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script>
import { fetchDistinctStores, fetchStoresByProductColorStorage } from '../api/inventory'

export default {
  name: 'StoreSelector',
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    product: { type: String, default: '' },
    color: { type: String, default: '' },
    storage: { type: [String, Number], default: '' }
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
        const allStores = await fetchDistinctStores()

        // Build a quick lookup for selection-supported stores (present rows) and availability by quantity
        let presenceMap = new Map()
        if (this.product && this.color) {
          const storesForSelection = await fetchStoresByProductColorStorage(this.product, this.color, this.storage)
          for (const s of storesForSelection) {
            const key = `${s.name}__${s.location}`
            presenceMap.set(key, { hasProduct: true, available: s.available })
          }
        }

        const normalizeKey = (n, l) => `${String(n).trim().replace(/\s+/g, ' ').toLowerCase()}__${String(l).trim().replace(/\s+/g, ' ').toLowerCase()}`
        const map = new Map()
        for (const s of allStores) {
          const key = normalizeKey(s.name, s.location)
          const presence = presenceMap.get(key)
          const hasProduct = presence?.hasProduct === true
          const hasInventory = presence?.available === true
          const cleanName = String(s.name).trim().replace(/\s+/g, ' ')
          const cleanLocation = String(s.location).trim().replace(/\s+/g, ' ')
          let label = `${cleanName} — ${cleanLocation}`
          if (this.product && this.color) {
            if (!hasProduct) {
              label = `(not available) ${label}`
            } else if (!hasInventory) {
              label = `(no available) ${label}`
            }
          }
          const value = { name: cleanName, location: cleanLocation }
          const item = {
            label,
            value,
            notAvailable: this.product && this.color ? !hasProduct : false
          }
          if (!map.has(key)) map.set(key, item)
        }
        this.storeItems = Array.from(map.values())
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
  },
  watch: {
    product() { this.loadStores() },
    color() { this.loadStores() },
    storage() { this.loadStores() }
  }
}
</script>

<style scoped>

</style>


