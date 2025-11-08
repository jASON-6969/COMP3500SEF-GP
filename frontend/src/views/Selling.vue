<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <h1 class="text-h4">Selling</h1>
          </v-card-title>
          <v-card-text>
            <InventorySearchPanel ref="inventorySearchPanel" @change="onSelectionChange" />
            

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
import CartPanel from '../components/CartPanel.vue'
import { loadCart, addItem as cartAddItem, updateQuantity as cartUpdateQuantity, removeItem as cartRemoveItem, clearCart as cartClear } from '../lib/cart'
import { sanitizeStorageValue } from '../lib/inventoryOps'

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
  watch: {
    // Refresh cart when returning to this page
    '$route'(to) {
      if (to.path === '/selling') {
        this.cart = loadCart()
      }
    }
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
    // Generate unique order ID (timestamp format: YYYYMMDDHHMMSSMMM)
    generateOrderId() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
      
      return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`
    },
    
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
          // Reset selection to allow user to select another product
          this.resetSelection()
        }
      } catch (e) {
        this.cartMessage = 'Failed to add to cart'
        this.cartMessageType = 'error'
      } finally {
        this.isAddingToCart = false
      }
    },
    resetSelection() {
      // Reset selected item and quantity
      this.selectedItem = null
      this.selectedQuantity = 1
      this.customQuantityValue = 1
      this.sellMessage = ''
      // Reset inventory search panel to go back to product selection
      if (this.$refs.inventorySearchPanel) {
        this.$refs.inventorySearchPanel.reset()
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
        
        // Prepare order data for confirmation page
        const orderData = {
          store: this.selectedItem.store,
          items: [{
            product: this.selectedItem.product,
            color: this.selectedItem.color,
            storage: this.selectedItem.storage,
            quantity: this.actualQuantity,
            price: latestUnitPrice || 0
          }]
        }
        
        // Store order data in localStorage for confirmation page
        localStorage.setItem('checkoutData', JSON.stringify(orderData))
        
        // Navigate to confirmation page
        this.$router.push('/checkout-confirm')
        
      } catch (error) {
        console.error('Error preparing checkout:', error)
        this.sellMessage = 'Checkout preparation failed: ' + error.message
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
        // First verify latest unit price and available quantity for each item
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

        // Prepare cart order data for confirmation page
        const cartItems = []
        for (const item of this.cart.items) {
          const latestUnitPrice = await fetchPrice(this.cart.store, item.product, item.color, item.storage)
          cartItems.push({
            product: item.product,
            color: item.color,
            storage: item.storage,
            quantity: item.quantity,
            price: latestUnitPrice || 0
          })
        }
        
        const orderData = {
          store: this.cart.store,
          items: cartItems
        }
        
        // Store order data in localStorage for confirmation page
        localStorage.setItem('checkoutData', JSON.stringify(orderData))
        
        // Navigate to confirmation page
        this.$router.push('/checkout-confirm')
        
      } catch (e) {
        console.error(e)
        this.cartMessage = `Checkout preparation failed: ${e.message}`
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