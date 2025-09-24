<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <StoreSelector v-model="selectedStore" />
        </v-col>
        <v-col cols="12" md="3">
          <ProductSelector :store="selectedStore" v-model="selectedProduct" />
        </v-col>
        <v-col cols="12" md="3">
          <ColorSelector :store="selectedStore" :product="selectedProduct" v-model="selectedColor" />
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-alert v-if="error" type="error" density="comfortable">{{ error }}</v-alert>
          <v-skeleton-loader v-else-if="loading" type="text" />
          <div v-else class="text-subtitle-1">
            <span>Quantity:</span>
            <span class="font-weight-bold ml-1">{{ quantityDisplay }}</span>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import StoreSelector from './StoreSelector.vue'
import ProductSelector from './ProductSelector.vue'
import ColorSelector from './ColorSelector.vue'
import { fetchQuantitySum } from '../api/inventory'

export default {
  name: 'InventorySearchPanel',
  components: { StoreSelector, ProductSelector, ColorSelector },
  emits: ['change'],
  data() {
    return {
      selectedStore: null,
      selectedProduct: '',
      selectedColor: '',
      loading: false,
      error: '',
      quantity: null
    }
  },
  computed: {
    quantityDisplay() {
      return this.quantity === null ? '-' : this.quantity
    }
  },
  watch: {
    selectedStore() { this.triggerQuery() },
    selectedProduct() { this.triggerQuery() },
    selectedColor() { this.triggerQuery() }
  },
  methods: {
    async triggerQuery() {
      this.$emit('change', {
        store: this.selectedStore,
        product: this.selectedProduct,
        color: this.selectedColor
      })

      if (!this.selectedStore || !this.selectedProduct || !this.selectedColor) {
        this.quantity = null
        return
      }

      this.loading = true
      this.error = ''
      try {
        const qty = await fetchQuantitySum(this.selectedStore, this.selectedProduct, this.selectedColor)
        this.quantity = qty
      } catch (err) {
        this.error = 'Failed to load quantity'
        // eslint-disable-next-line no-console
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

</style>


