<template>
  <v-autocomplete
    :disabled="!store || !product || !color"
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
import { fetchStoragesByStoreProductColor } from '../api/inventory'

export default {
  name: 'StorageSelector',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    store: { type: Object, default: null },
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
      return this.items.map(v => ({ label: `${v}GB`, value: v }))
    }
  },
  watch: {
    store: { handler() { this.load() }, immediate: true },
    product() { this.load() },
    color() { this.load() }
  },
  methods: {
    async load() {
      if (!this.store || !this.product || !this.color) {
        this.items = []
        this.$emit('options', 0)
        return
      }
      this.loading = true
      try {
        const storages = await fetchStoragesByStoreProductColor(this.store, this.product, this.color)
        this.items = storages
        this.$emit('options', this.items.length)
        if (this.items.length === 0) {
          // 清空已选存储，避免卡住查询
          this.$emit('update:modelValue', '')
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load storages', err)
        this.$emit('options', 0)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

</style>


