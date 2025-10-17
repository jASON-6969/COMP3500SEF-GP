<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5 text-center">
            <v-icon left>mdi-check-circle</v-icon>
            Checkout
          </v-card-title>
          
          <!-- Success/Error Messages -->
          <v-alert v-if="successMessage" type="success" class="ma-4" closable @click:close="successMessage = ''">
            {{ successMessage }}
          </v-alert>
          <v-alert v-if="errorMessage" type="error" class="ma-4" closable @click:close="errorMessage = ''">
            {{ errorMessage }}
          </v-alert>
          
          <v-card-text>
            <!-- Shop Information -->
            <v-card class="mb-4" elevation="1">
              <v-card-title class="text-h6">
                <v-icon left>mdi-store</v-icon>
                Store Information
              </v-card-title>
              <v-card-text>
                <v-list dense>
                  <v-list-item>
                    <template v-slot:title>
                      {{ orderData.store.name }}
                    </template>
                    <template v-slot:subtitle>
                      {{ orderData.store.location }}
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Apple Account -->
            <v-card class="mb-4" elevation="1">
              <v-card-title class="text-h6">
                <v-icon left>mdi-apple</v-icon>
                Apple Account
              </v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="appleAccount"
                  label="Apple ID"
                  placeholder="Enter your Apple ID"
                  variant="outlined"
                  readonly
                  append-icon="mdi-pencil"
                  @click:append="editAppleAccount"
                ></v-text-field>
              </v-card-text>
            </v-card>

            <!-- Payment Method -->
            <v-card class="mb-4" elevation="1">
              <v-card-title class="text-h6">
                <v-icon left>mdi-credit-card</v-icon>
                Payment Method
              </v-card-title>
              <v-card-text>
                <v-select
                  v-model="selectedPayment"
                  :items="paymentMethods"
                  item-title="text"
                  item-value="value"
                  label="Select Payment Method"
                  variant="outlined"
                ></v-select>
              </v-card-text>
            </v-card>

            <!-- Voucher -->
            <v-card class="mb-4" elevation="1">
              <v-card-title class="text-h6">
                <v-icon left>mdi-ticket-percent</v-icon>
                Voucher
              </v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="voucherCode"
                  label="Voucher Code"
                  placeholder="Enter voucher code"
                  variant="outlined"
                  append-icon="mdi-check"
                  @click:append="applyVoucher"
                ></v-text-field>
                <v-alert
                  v-if="voucherMessage"
                  :type="voucherMessageType"
                  class="mt-2"
                  density="compact"
                >
                  {{ voucherMessage }}
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Items -->
            <v-card class="mb-4" elevation="1">
              <v-card-title class="text-h6">
                <v-icon left>mdi-package-variant</v-icon>
                Product Information
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="(item, index) in orderData.items"
                    :key="index"
                  >
                    <template v-slot:title>
                      {{ item.product }}
                    </template>
                    <template v-slot:subtitle>
                      Color: {{ item.color }} | 
                      Storage: {{ item.storage || 'N/A' }} | 
                      Quantity: {{ item.quantity }}
                    </template>
                    <template v-slot:append>
                      <span class="text-h6">${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Order Summary -->
            <v-card elevation="2" class="mt-4">
              <v-card-text>
                <v-row>
                  <v-col cols="6">
                    <div class="text-h6">Subtotal</div>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <div class="text-h6">${{ subtotal.toFixed(2) }}</div>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="6">
                    <div class="text-h6">Discount</div>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <div class="text-h6">-${{ discount.toFixed(2) }}</div>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="6">
                    <div class="text-h6">Tax</div>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <div class="text-h6">N/A</div>
                  </v-col>
                </v-row>
                <v-divider class="my-2"></v-divider>
                <v-row>
                  <v-col cols="6">
                    <div class="text-h5 font-weight-bold">Total</div>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <div class="text-h5 font-weight-bold">${{ total.toFixed(2) }}</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Action Buttons -->
            <v-card-actions class="mt-4">
              <v-btn
                color="secondary"
                size="large"
                @click="goBack"
              >
                <v-icon left>mdi-arrow-left</v-icon>
                Back
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                size="large"
                :loading="isProcessing"
                @click="confirmOrder"
              >
                <v-icon left>mdi-check</v-icon>
                Confirm Order
              </v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Apple Account Dialog -->
    <v-dialog v-model="showAppleAccountDialog" max-width="400">
      <v-card>
        <v-card-title>Edit Apple Account</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="tempAppleAccount"
            label="Apple ID"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAppleAccountDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveAppleAccount">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { clearCart } from '../lib/cart'

export default {
  name: 'CheckoutConfirm',
  data() {
    return {
      orderData: {
        store: { name: '', location: '' },
        items: []
      },
      appleAccount: 'user@example.com',
      selectedPayment: 'credit_card',
      voucherCode: '',
      voucherMessage: '',
      voucherMessageType: 'info',
      isProcessing: false,
      showAppleAccountDialog: false,
      tempAppleAccount: '',
      successMessage: '',
      errorMessage: '',
      paymentMethods: [
        { text: 'Credit Card', value: 'credit_card' },
        { text: 'Debit Card', value: 'debit_card' },
        { text: 'PayPal', value: 'paypal' },
        { text: 'Apple Pay', value: 'apple_pay' }
      ],
      discount: 0
    }
  },
  computed: {
    subtotal() {
      return this.orderData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity)
      }, 0)
    },
    total() {
      return this.subtotal - this.discount
    }
  },
  created() {
    // Load order data from route parameters or localStorage
    this.loadOrderData()
  },
  methods: {
    loadOrderData() {
      // Get order data from localStorage or route parameters
      const orderData = this.$route.params.orderData || JSON.parse(localStorage.getItem('checkoutData') || '{}')
      if (orderData.store && orderData.items) {
        this.orderData = orderData
      } else {
        // If no data, return to selling page
        this.$router.push('/selling')
      }
    },
    goBack() {
      this.$router.go(-1)
    },
    editAppleAccount() {
      this.tempAppleAccount = this.appleAccount
      this.showAppleAccountDialog = true
    },
    saveAppleAccount() {
      this.appleAccount = this.tempAppleAccount
      this.showAppleAccountDialog = false
    },
    applyVoucher() {
      if (!this.voucherCode.trim()) {
        this.voucherMessage = 'Please enter voucher code'
        this.voucherMessageType = 'warning'
        return
      }
      
      // Simulate voucher validation (UI demo only)
      if (this.voucherCode.toLowerCase() === 'discount10') {
        this.discount = this.subtotal * 0.1
        this.voucherMessage = 'Voucher applied successfully! Enjoy 10% discount'
        this.voucherMessageType = 'success'
      } else {
        this.voucherMessage = 'Invalid voucher code'
        this.voucherMessageType = 'error'
        this.discount = 0
      }
    },
    async confirmOrder() {
      this.isProcessing = true
      
      try {
        // Import required functions
        const { createSale } = await import('../api/sales')
        const { getInventoryRecordId, deductInventory } = await import('../lib/inventoryOps')
        const { sanitizeStorageValue } = await import('../lib/inventoryOps')
        
        // Generate unique order ID for this sale
        const orderId = this.generateOrderId()
        
        // Process each item in the order
        for (const item of this.orderData.items) {
          // Get the inventory record ID before deducting
          const inventoryRecordId = await getInventoryRecordId({
            store: this.orderData.store,
            product: item.product,
            color: item.color,
            storage: item.storage
          })
          
          // Create sale record with inventory ID
          const saleData = {
            time: new Date().toISOString(),
            id: inventoryRecordId,
            order_id: orderId,
            name: this.orderData.store.name,
            product: item.product,
            price: item.price * item.quantity,
            quantity: item.quantity,
            store_location: this.orderData.store.location,
            color: item.color,
            storage: sanitizeStorageValue(item.storage),
            unit_price: item.price
          }
          
          await createSale(saleData)
          
          // Deduct inventory from the inventory table
          await deductInventory({
            store: this.orderData.store,
            product: item.product,
            color: item.color,
            storage: item.storage
          }, item.quantity)
        }
        
        // Show success message
        this.successMessage = 'Order confirmed successfully!'
        this.errorMessage = ''
        
        // Clear the cart after successful order
        clearCart()
        
        // Clear checkout data from localStorage
        localStorage.removeItem('checkoutData')
        
        // Return to selling page after a short delay to show success message
        setTimeout(() => {
          this.$router.push('/selling')
        }, 2000)
        
      } catch (error) {
        console.error('Error confirming order:', error)
        this.errorMessage = 'Order confirmation failed, please try again'
        this.successMessage = ''
      } finally {
        this.isProcessing = false
      }
    },
    
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
    }
  }
}
</script>

<style scoped>
.v-card {
  margin-bottom: 16px;
}

.text-h6 {
  font-weight: 600;
}

.font-weight-bold {
  font-weight: 700;
}
</style>
