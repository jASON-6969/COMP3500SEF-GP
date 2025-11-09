<template>
  <v-card>
    <v-card-text>
      <v-expansion-panels v-model="activePanel" variant="accordion" class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>Product</v-expansion-panel-title>
          <v-expansion-panel-text>
            <ProductSelector v-model="selectedProduct" />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="!!selectedProduct">
          <v-expansion-panel-title>Color</v-expansion-panel-title>
          <v-expansion-panel-text>
            <ColorSelector :product="selectedProduct" v-model="selectedColor" />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="!!selectedColor">
          <v-expansion-panel-title>Storage</v-expansion-panel-title>
          <v-expansion-panel-text>
            <StorageSelector
              :product="selectedProduct"
              :color="selectedColor"
              v-model="selectedStorage"
              @options="onStorageOptions"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="!!selectedColor">
          <v-expansion-panel-title>Store</v-expansion-panel-title>
          <v-expansion-panel-text>
            <StoreSelector
              v-model="selectedStore"
              :product="selectedProduct"
              :color="selectedColor"
              :storage="normalizedStorage"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-alert v-if="error" type="error" density="comfortable">{{ error }}</v-alert>
          <v-skeleton-loader v-else-if="loading" type="text" />
          <div v-else class="text-subtitle-1">
            <span v-if="selectedStore">Quantity:</span>
            <span v-if="selectedStore" class="font-weight-bold ml-1">{{ quantityDisplay }}</span>
            <span v-if="selectedStore && selectedStorage" class="ml-4">Storage:</span>
            <span v-if="selectedStore && selectedStorage" class="font-weight-bold ml-1">{{ selectedStorage }}GB</span>
            <span v-if="selectedStore && price !== null && price !== undefined" class="ml-4">Price:</span>
            <span v-if="selectedStore && price !== null && price !== undefined" class="font-weight-bold ml-1">${{ price }}</span>
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
import { fetchQuantitySum, fetchPrice } from '../api/inventory'

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
      price: null,
      storageOptionsCount: 0,
      storageOptions: [], // Store the actual storage options
      activePanel: 0
    }
  },
  computed: {
    quantityDisplay() {
      return this.quantity === null ? '-' : this.quantity
    },
    hasStoreProductColor() {
      return !!this.selectedStore && !!this.selectedProduct && !!this.selectedColor
    },
    // Normalize storage: empty string becomes null for products without storage
    normalizedStorage() {
      return this.selectedStorage === '' ? null : this.selectedStorage
    },
    // Calculate which panel should be active based on current selections
    computedActivePanel() {
      if (!this.selectedProduct) return 0
      if (!this.selectedColor) return 1
      // If store is already selected, stay on store panel
      if (this.selectedStore) return 3
      // If storage is already selected (any value including null), move to store panel
      // User has completed storage selection, so move to next step
      if (this.selectedStorage !== '' && this.selectedStorage !== undefined) {
        return 3 // Move to store panel
      }
      // If storageOptionsCount is 0, we're still loading - wait and show storage panel
      // This prevents jumping to store panel before storage options are loaded
      if (this.storageOptionsCount === 0) return 2
      // If there's only one option and it's null, auto-skip to store panel
      if (this.storageOptionsCount === 1 && this.storageOptions.length === 1) {
        const onlyOption = this.storageOptions[0]
        if (onlyOption === null || onlyOption === undefined) {
          // Auto-select null and move to store panel
          return 3
        }
      }
      // If there are options (more than one, or one non-null), show storage panel
      if (this.storageOptionsCount > 0) return 2
      // Only skip to store panel if there are truly no options
      return 3 // Store panel
    }
  },
  watch: {
    selectedProduct() { 
      this.resetAfterProduct()
      this.emitSelection()
      this.$nextTick(() => { this.activePanel = this.computedActivePanel })
    },
    selectedColor() { 
      this.resetAfterColor()
      this.emitSelection()
      this.$nextTick(() => { this.activePanel = this.computedActivePanel })
    },
    selectedStorage() { 
      this.emitSelection()
      this.$nextTick(() => { this.activePanel = this.computedActivePanel })
    },
    selectedStore() { 
      this.triggerQuery()
      this.$nextTick(() => { this.activePanel = this.computedActivePanel })
    },
    storageOptionsCount() {
      // When storage options change, adjust panel if needed
      this.$nextTick(() => { 
        // If there are no options, skip to store panel
        if (this.storageOptionsCount === 0) {
          // Clear selected storage when there are no valid options
          if (this.selectedStorage) {
            this.selectedStorage = ''
          }
          // If we're on storage panel and there are no options, move to store panel
          if (this.selectedColor && !this.selectedStore && this.activePanel === 2) {
            this.activePanel = 3
          }
        }
        // If there's only one option and it's null, auto-select it and skip to store panel
        else if (this.storageOptionsCount === 1 && this.storageOptions.length === 1) {
          const onlyOption = this.storageOptions[0]
          if ((onlyOption === null || onlyOption === undefined) && onlyOption !== '(not available)') {
            // Auto-select null and move to store panel
            if (this.selectedStorage === '') {
              this.selectedStorage = null
            }
            if (this.selectedColor && !this.selectedStore && this.activePanel === 2) {
              this.activePanel = 3
            }
          }
        }
      })
    }
  },
  methods: {
    onStorageOptions(optionsInfo) {
      // optionsInfo is now an object: { count, items }
      this.storageOptionsCount = optionsInfo.count
      this.storageOptions = optionsInfo.items || []
      
      // If there's only one option and it's null, auto-select it and skip to store panel
      if (optionsInfo.count === 1 && this.storageOptions.length === 1) {
        const onlyOption = this.storageOptions[0]
        if ((onlyOption === null || onlyOption === undefined) && onlyOption !== '(not available)') {
          // Auto-select null
          if (this.selectedStorage === '') {
            this.selectedStorage = null
          }
          this.$nextTick(() => {
            // Move to store panel if we have color selected but not store
            if (this.selectedColor && !this.selectedStore) {
              this.activePanel = 3
            }
          })
        }
      }
      // If there are no options, skip to store panel
      else if (optionsInfo.count === 0 && !this.selectedStorage) {
        this.$nextTick(() => {
          // Move to store panel if we have color selected but not store
          if (this.selectedColor && !this.selectedStore) {
            this.activePanel = 3
          }
        })
      }
    },
    reset() {
      this.selectedProduct = ''
      this.selectedColor = ''
      this.selectedStorage = ''
      this.selectedStore = null
      this.storageOptionsCount = 0
      this.quantity = null
      this.price = null
      this.error = ''
      this.activePanel = 0
    },
    resetAfterProduct() {
      this.selectedColor = ''
      this.selectedStorage = ''
      this.selectedStore = null
      this.storageOptionsCount = 0
      this.storageOptions = []
      this.quantity = null
      this.price = null
    },
    resetAfterColor() {
      this.selectedStorage = ''
      this.selectedStore = null
      this.storageOptionsCount = 0
      this.storageOptions = []
      this.quantity = null
      this.price = null
    },
    emitSelection() {
      this.$emit('change', {
        store: this.selectedStore,
        product: this.selectedProduct,
        color: this.selectedColor,
        storage: this.normalizedStorage
      })
    },
    async triggerQuery() {
      this.emitSelection()

      if (!this.selectedStore || !this.selectedProduct || !this.selectedColor) {
        this.quantity = null
        this.price = null
        return
      }

      this.loading = true
      this.error = ''
      try {
        const [qty, price] = await Promise.all([
          fetchQuantitySum(this.selectedStore, this.selectedProduct, this.selectedColor, this.normalizedStorage),
          fetchPrice(this.selectedStore, this.selectedProduct, this.selectedColor, this.normalizedStorage)
        ])
        this.quantity = qty
        this.price = price
      } catch (err) {
        this.error = 'Failed to load data'
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


