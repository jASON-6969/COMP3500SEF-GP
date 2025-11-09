<template>
  <v-autocomplete
    :disabled="!product || !color"
    :items="displayItems"
    :loading="loading"
    :model-value="modelValue"
    item-title="label"
    item-value="value"
    label="Storage"
    placeholder="Select storage"
    clearable
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script>
import { fetchStoragesByProductColor } from '../api/inventory'

export default {
  name: 'StorageSelector',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    store: { type: Object, default: null }, // kept for compatibility, unused in new flow
    product: { type: String, default: '' },
    color: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'options'],
  data() {
    return {
      loading: false,
      items: []
    }
  },
  computed: {
    displayItems() {
      return this.items.map(v => {
        if (v === '(not available)') {
          return { label: '(not available)', value: '' }
        }
        if (v === null || v === undefined) {
          return { label: 'NULL', value: null }
        }
        return { label: `${v}GB`, value: v }
      })
    }
  },
  watch: {
    product: { handler() { this.load() }, immediate: true },
    color() { this.load() }
  },
  methods: {
    async load() {
      if (!this.product || !this.color) {
        this.items = []
        this.$emit('options', { count: 0, items: [] })
        return
      }
      this.loading = true
      try {
        const storages = await fetchStoragesByProductColor(this.product, this.color)
        this.items = (storages && storages.length) ? storages : ['(not available)']
        this.$emit('options', { count: this.items.length, items: this.items })
        if (this.items.length === 0) {
          // Clear selected storage to avoid query issues
          this.$emit('update:modelValue', '')
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load storages', err)
        this.items = ['(not available)']
        this.$emit('options', { count: 1, items: this.items })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

</style>


