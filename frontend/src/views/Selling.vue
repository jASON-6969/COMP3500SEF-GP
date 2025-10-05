<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <h1 class="text-h4">Selling</h1>
          </v-card-title>
          <v-card-text>
            <InventorySearchPanel @change="onSelectionChange" />
            

            <!-- Quantity Selection - Always show when selectedItem exists -->
            <v-card v-if="selectedItem" class="mt-4" elevation="2">
              <v-card-title>Select Sale Quantity</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-radio-group v-model="selectedQuantity" row>
                      <v-radio label="1" :value="1"></v-radio>
                      <v-radio label="2" :value="2"></v-radio>
                      <v-radio label="3" :value="3"></v-radio>
                      <v-radio label="4" :value="4"></v-radio>
                      <v-radio label="Custom" :value="customQuantity"></v-radio>
                    </v-radio-group>
                  </v-col>
                  <v-col cols="6" v-if="selectedQuantity === customQuantity">
                    <v-text-field
                      v-model="customQuantityValue"
                      label="Custom Quantity"
                      type="number"
                      min="1"
                      :max="selectedItem.quantity"
                      outlined
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-h6">
                      <strong>Total Price: {{ totalPriceDisplay }}</strong>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Sell Button - Always show when selectedItem exists -->
            <v-card v-if="selectedItem" class="mt-4" elevation="2">
              <v-card-text>
                <v-btn
                  color="primary"
                  size="large"
                  :disabled="!canSell"
                  :loading="isSelling"
                  @click="handleSell"
                >
                  Checkout
                </v-btn>
                <v-btn
                  class="ml-2"
                  color="secondary"
                  size="large"
                  :disabled="!canSell"
                  :loading="isAddingToCart"
                  @click="handleAddToCart"
                >
                  Add to Cart
                </v-btn>
                <v-alert
                  v-if="sellMessage"
                  :type="sellMessageType"
                  class="mt-2"
                >
                  {{ sellMessage }}
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Cart Panel at bottom -->
            <CartPanel
              :items="cart.items"
              :loading="isCartProcessing"
              :estimates="priceEstimates"
              :total-estimate="totalEstimate"
              :message="cartMessage"
              :message-type="cartMessageType"
              @update-qty="onCartUpdateQty"
              @remove-item="onCartRemoveItem"
              @clear="onCartClear"
              @checkout="onCartCheckout"
              @refresh-prices="onRefreshEstimates"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import InventorySearchPanel from '../components/InventorySearchPanel.vue'
import { fetchPrice, fetchQuantitySum } from '../api/inventory'
import { createSale } from '../api/sales'
import CartPanel from '../components/CartPanel.vue'
import { loadCart, addItem as cartAddItem, updateQuantity as cartUpdateQuantity, removeItem as cartRemoveItem, clearCart as cartClear } from '../lib/cart'
import { sanitizeStorageValue, getInventoryRecordId, deductInventory } from '../lib/inventoryOps'

export default {
  name: 'SellingPage',
  components: { InventorySearchPanel, CartPanel },
  data() {
    return {
      selectedItem: null,
      selectedQuantity: 1,
      customQuantity: 'custom',
      customQuantityValue: 1,
      isSelling: false,
      isAddingToCart: false,
      sellMessage: '',
      sellMessageType: 'success',
      cart: { store: null, items: [] },
      isCartProcessing: false,
      cartMessage: '',
      cartMessageType: 'success',
      priceEstimates: null,
      totalEstimate: null
    }
  },
  created() {
    this.cart = loadCart()
  },
  computed: {
    actualQuantity() {
      if (this.selectedQuantity === this.customQuantity) {
        return parseInt(this.customQuantityValue) || 1
      }
      return this.selectedQuantity
    },
    totalPrice() {
      if (!this.selectedItem || !this.selectedItem.price) return 0
      return this.selectedItem.price * this.actualQuantity
    },
    totalPriceDisplay() {
      if (!this.selectedItem || !this.selectedItem.price) return '$0'
      const price = this.selectedItem.price * this.actualQuantity
      return `$${price.toFixed(2)}`
    },
    canSell() {
      return this.selectedItem && 
             this.selectedItem.price && 
             this.actualQuantity > 0 && 
             this.actualQuantity <= (this.selectedItem.quantity || 0)
    }
  },
  methods: {
    async onSelectionChange(payload) {
      console.log('Selection changed', payload)
      
      // Check if we have all required fields (store, product, color)
      if (payload.store && payload.product && payload.color) {
        try {
          // Handle storage field properly - use null instead of empty string for bigint
          const storageValue = sanitizeStorageValue(payload.storage)
          
          // Fetch price and inventory information
          const [price, quantity] = await Promise.all([
            fetchPrice(payload.store, payload.product, payload.color, storageValue),
            fetchQuantitySum(payload.store, payload.product, payload.color, storageValue)
          ])
          
          this.selectedItem = {
            store: payload.store,
            product: payload.product,
            color: payload.color,
            storage: storageValue,
            price: price,
            quantity: quantity
          }
          
          // Reset quantity selection
          this.selectedQuantity = 1
          this.customQuantityValue = 1
          this.sellMessage = ''
        } catch (error) {
          console.error('Error fetching item details:', error)
          this.sellMessage = 'Error fetching product information'
          this.sellMessageType = 'error'
        }
      } else {
        this.selectedItem = null
        this.sellMessage = ''
      }
    },
    handleAddToCart() {
      if (!this.canSell) return
      this.isAddingToCart = true
      this.cartMessage = ''
      try {
        const line = {
          product: this.selectedItem.product,
          color: this.selectedItem.color,
          storage: this.selectedItem.storage,
          quantity: this.actualQuantity
        }
        const { cart: next, error } = cartAddItem(this.cart, this.selectedItem.store, line)
        if (error) {
          this.cartMessage = error
          this.cartMessageType = 'error'
        } else {
          this.cart = next
          this.cartMessage = 'Added to cart'
          this.cartMessageType = 'success'
        }
      } catch (e) {
        this.cartMessage = 'Failed to add to cart'
        this.cartMessageType = 'error'
      } finally {
        this.isAddingToCart = false
      }
    },
    
    async handleSell() {
      if (!this.canSell) return
      
      this.isSelling = true
      this.sellMessage = ''
      
      try {
        // Latest unit price at checkout time
        const latestUnitPrice = await fetchPrice(
          this.selectedItem.store,
          this.selectedItem.product,
          this.selectedItem.color,
          this.selectedItem.storage
        )
        // Get the inventory record ID before deducting
        const inventoryRecordId = await getInventoryRecordId({
          store: this.selectedItem.store,
          product: this.selectedItem.product,
          color: this.selectedItem.color,
          storage: this.selectedItem.storage
        })
        
        // Create sale record with inventory ID
        const saleData = {
          time: new Date().toISOString(),
          id: inventoryRecordId, // Use the same ID as inventory record
          name: this.selectedItem.store.name,
          product: this.selectedItem.product,
          price: (latestUnitPrice || 0) * this.actualQuantity,
          quantity: this.actualQuantity,
          store_location: this.selectedItem.store.location,
          color: this.selectedItem.color,
          storage: sanitizeStorageValue(this.selectedItem.storage),
          unit_price: latestUnitPrice
        }
        
        await createSale(saleData)
        
        // Deduct inventory from the inventory table
        await deductInventory({
          store: this.selectedItem.store,
          product: this.selectedItem.product,
          color: this.selectedItem.color,
          storage: this.selectedItem.storage
        }, this.actualQuantity)
        
        this.sellMessage = `Successfully sold ${this.actualQuantity} items for $${(latestUnitPrice || 0) * this.actualQuantity}`
        this.sellMessageType = 'success'
        
        // Refresh inventory information
        const quantity = await fetchQuantitySum(
          this.selectedItem.store, 
          this.selectedItem.product, 
          this.selectedItem.color, 
          this.selectedItem.storage
        )
        this.selectedItem.quantity = quantity
        
        // Reset quantity selection
        this.selectedQuantity = 1
        this.customQuantityValue = 1
        
      } catch (error) {
        console.error('Error creating sale:', error)
        this.sellMessage = 'Sale failed: ' + error.message
        this.sellMessageType = 'error'
      } finally {
        this.isSelling = false
      }
    },
    onCartUpdateQty({ key, quantity }) {
      this.cart = cartUpdateQuantity(this.cart, key, quantity)
      this.cartMessage = ''
    },
    onCartRemoveItem(key) {
      this.cart = cartRemoveItem(this.cart, key)
      this.cartMessage = ''
    },
    onCartClear() {
      this.cart = cartClear()
      this.cartMessage = ''
      this.priceEstimates = null
      this.totalEstimate = null
    },
    async onCartCheckout() {
      if (!this.cart || this.cart.items.length === 0) return
      this.isCartProcessing = true
      this.cartMessage = ''
      try {
        // 先逐筆驗最新單價與可售數量
        for (const item of this.cart.items) {
          const [qtyAvailable] = await Promise.all([
            fetchQuantitySum(this.cart.store, item.product, item.color, item.storage)
          ])
          if (qtyAvailable < item.quantity) {
            this.cartMessage = `Insufficient inventory for ${item.product} ${item.color} ${item.storage || ''}. Available: ${qtyAvailable}, Required: ${item.quantity}`
            this.cartMessageType = 'error'
            return
          }
        }

        // 逐筆結帳與扣庫存（依你的決策逐筆處理）
        for (const item of this.cart.items) {
          const latestUnitPrice = await fetchPrice(this.cart.store, item.product, item.color, item.storage)
          const inventoryRecordId = await getInventoryRecordId({
            store: this.cart.store,
            product: item.product,
            color: item.color,
            storage: item.storage
          })
          const saleData = {
            time: new Date().toISOString(),
            id: inventoryRecordId,
            name: this.cart.store.name,
            product: item.product,
            price: (latestUnitPrice || 0) * item.quantity,
            quantity: item.quantity,
            store_location: this.cart.store.location,
            color: item.color,
            storage: sanitizeStorageValue(item.storage),
            unit_price: latestUnitPrice
          }
          await createSale(saleData)
          await deductInventory({
            store: this.cart.store,
            product: item.product,
            color: item.color,
            storage: item.storage
          }, item.quantity)
        }

        this.cart = cartClear()
        this.cartMessage = 'Checkout completed.'
        this.cartMessageType = 'success'
      } catch (e) {
        console.error(e)
        this.cartMessage = `Checkout failed: ${e.message}`
        this.cartMessageType = 'error'
      } finally {
        this.isCartProcessing = false
      }
    },
    async onRefreshEstimates() {
      if (!this.cart || this.cart.items.length === 0 || !this.cart.store) {
        this.priceEstimates = null
        this.totalEstimate = null
        return
      }
      this.isCartProcessing = true
      try {
        const estimates = {}
        let total = 0
        for (const item of this.cart.items) {
          const unit = await fetchPrice(this.cart.store, item.product, item.color, item.storage)
          estimates[item.key] = unit
          total += (Number(unit) || 0) * (Number(item.quantity) || 0)
        }
        this.priceEstimates = estimates
        this.totalEstimate = total
      } catch (e) {
        console.error(e)
        this.cartMessage = 'Failed to refresh prices'
        this.cartMessageType = 'error'
      } finally {
        this.isCartProcessing = false
      }
    }
  }
}
</script>

<style scoped>

</style>