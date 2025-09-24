<template>
  <v-card>
    <v-card-text>
      <v-expansion-panels v-model="activePanel" variant="accordion" class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>Store</v-expansion-panel-title>
          <v-expansion-panel-text>
            <StoreSelector v-model="selectedStore" />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="!!selectedStore">
          <v-expansion-panel-title>Product</v-expansion-panel-title>
          <v-expansion-panel-text>
            <ProductSelector :store="selectedStore" v-model="selectedProduct" />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="!!selectedProduct">
          <v-expansion-panel-title>Color</v-expansion-panel-title>
          <v-expansion-panel-text>
            <ColorSelector :store="selectedStore" :product="selectedProduct" v-model="selectedColor" />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="hasStoreProductColor" :style="{ display: storageOptionsCount > 0 ? '' : 'none' }">
          <v-expansion-panel-title>Storage</v-expansion-panel-title>
          <v-expansion-panel-text>
            <StorageSelector
              :store="selectedStore"
              :product="selectedProduct"
              :color="selectedColor"
              v-model="selectedStorage"
              @options="onStorageOptions"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-alert v-if="error" type="error" density="comfortable">{{ error }}</v-alert>
          <v-skeleton-loader v-else-if="loading" type="text" />
          <div v-else class="text-subtitle-1">
            <span>Quantity:</span>
            <span class="font-weight-bold ml-1">{{ quantityDisplay }}</span>
            <span v-if="selectedStorage" class="ml-4">Storage:</span>
            <span v-if="selectedStorage" class="font-weight-bold ml-1">{{ selectedStorage }}GB</span>
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
import StorageSelector from './StorageSelector.vue'
import { fetchQuantitySum } from '../api/inventory'

export default {
  name: 'InventorySearchPanel',
  components: { StoreSelector, ProductSelector, ColorSelector, StorageSelector },
  emits: ['change'],
  data() {
    return {
      selectedStore: null,
      selectedProduct: '',
      selectedColor: '',
      selectedStorage: '',
      loading: false,
      error: '',
      quantity: null,
      storageOptionsCount: 0,
      activePanel: 0
    }
  },
  computed: {
    quantityDisplay() {
      return this.quantity === null ? '-' : this.quantity
    },
    hasStoreProductColor() {
      return !!this.selectedStore && !!this.selectedProduct && !!this.selectedColor
    }
  },
  watch: {
    selectedStore() { this.resetStorageState(); this.triggerQuery(); this.activePanel = 1 },
    selectedProduct() { this.resetStorageState(); this.triggerQuery(); this.activePanel = 2 },
    selectedColor() { this.resetStorageState(); this.triggerQuery(); this.activePanel = 3 },
    selectedStorage() { this.triggerQuery() }
  },
  methods: {
    onStorageOptions(count) {
      this.storageOptionsCount = count
    },
    resetStorageState() {
      this.selectedStorage = ''
      this.storageOptionsCount = 0
    },
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
        const qty = await fetchQuantitySum(this.selectedStore, this.selectedProduct, this.selectedColor, this.selectedStorage)
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


