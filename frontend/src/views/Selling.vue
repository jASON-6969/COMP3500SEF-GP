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
                <v-alert
                  v-if="sellMessage"
                  :type="sellMessageType"
                  class="mt-2"
                >
                  {{ sellMessage }}
                </v-alert>
              </v-card-text>
            </v-card>
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
import supabase from '../lib/supabase'

export default {
  name: 'SellingPage',
  components: { InventorySearchPanel },
  data() {
    return {
      selectedItem: null,
      selectedQuantity: 1,
      customQuantity: 'custom',
      customQuantityValue: 1,
      isSelling: false,
      sellMessage: '',
      sellMessageType: 'success'
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
    sanitizeStorageValue(storage) {
      // Convert empty strings, null, undefined to null for bigint compatibility
      if (storage === '' || storage === null || storage === undefined) {
        return null
      }
      return storage
    },
    async onSelectionChange(payload) {
      console.log('Selection changed', payload)
      
      // Check if we have all required fields (store, product, color)
      if (payload.store && payload.product && payload.color) {
        try {
          // Handle storage field properly - use null instead of empty string for bigint
          const storageValue = this.sanitizeStorageValue(payload.storage)
          
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
    
    async handleSell() {
      if (!this.canSell) return
      
      this.isSelling = true
      this.sellMessage = ''
      
      try {
        // First, get the inventory record ID before deducting
        const inventoryRecordId = await this.getInventoryRecordId()
        
        // Create sale record with inventory ID
        const saleData = {
          time: new Date().toISOString(),
          id: inventoryRecordId, // Use the same ID as inventory record
          name: this.selectedItem.store.name,
          product: this.selectedItem.product,
          price: this.totalPrice,
          quantity: this.actualQuantity,
          store_location: this.selectedItem.store.location,
          color: this.selectedItem.color,
          storage: this.sanitizeStorageValue(this.selectedItem.storage),
          unit_price: this.selectedItem.price
        }
        
        await createSale(saleData)
        
        // Deduct inventory from the inventory table
        await this.deductInventory()
        
        this.sellMessage = `Successfully sold ${this.actualQuantity} items for $${this.totalPrice}`
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
    
    async getInventoryRecordId() {
      const { name, location } = this.selectedItem.store
      const { product, color, storage } = this.selectedItem
      
      // Get inventory record ID that matches the selected criteria
      let query = supabase
        .from('inventory')
        .select('id')
        .eq('name', name)
        .eq('location', location)
        .ilike('product', product)
        .ilike('color', color)
      
      // Include storage filter
      const sanitizedStorage = this.sanitizeStorageValue(storage)
      if (sanitizedStorage !== null) {
        const storageNumber = Number(sanitizedStorage)
        query = Number.isNaN(storageNumber)
          ? query.eq('storage', String(sanitizedStorage))
          : query.eq('storage', storageNumber)
      } else {
        query = query.or('storage.is.null,storage.eq.')
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error(`No inventory record found for ${product} ${color} ${storage ? storage + 'GB' : 'no storage'}`)
      }
      
      // Return the first record's ID
      return data[0].id
    },
    
    async deductInventory() {
      const { name, location } = this.selectedItem.store
      const { product, color, storage } = this.selectedItem
      const quantityToDeduct = this.actualQuantity
      
      // Get inventory records that match EXACTLY the selected criteria
      let query = supabase
        .from('inventory')
        .select('*')
        .eq('name', name)
        .eq('location', location)
        .ilike('product', product)
        .ilike('color', color)
      
      // ALWAYS include storage filter to ensure exact match
      const sanitizedStorage = this.sanitizeStorageValue(storage)
      if (sanitizedStorage !== null) {
        const storageNumber = Number(sanitizedStorage)
        query = Number.isNaN(storageNumber)
          ? query.eq('storage', String(sanitizedStorage))
          : query.eq('storage', storageNumber)
      } else {
        // If no storage specified, only match records where storage is null or empty
        query = query.or('storage.is.null,storage.eq.')
      }
      
      const { data: inventoryRecords, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      if (!inventoryRecords || inventoryRecords.length === 0) {
        throw new Error(`No inventory records found for ${product} ${color} ${storage ? storage + 'GB' : 'no storage'}`)
      }
      
      // Calculate total available quantity for this exact product variant
      let totalAvailable = 0
      for (const record of inventoryRecords) {
        totalAvailable += Number(record.quantity) || 0
      }
      
      if (totalAvailable < quantityToDeduct) {
        throw new Error(`Insufficient inventory. Available: ${totalAvailable}, Required: ${quantityToDeduct}`)
      }
      
      // Deduct quantity from records until we've deducted the required amount
      let remainingToDeduct = quantityToDeduct
      
      for (const record of inventoryRecords) {
        if (remainingToDeduct <= 0) break
        
        const currentQuantity = Number(record.quantity) || 0
        const deductFromThisRecord = Math.min(remainingToDeduct, currentQuantity)
        
        if (deductFromThisRecord > 0) {
          const newQuantity = currentQuantity - deductFromThisRecord
          
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ quantity: newQuantity })
            .eq('id', record.id)
            .eq('name', record.name)
            .eq('location', record.location)
          
          if (updateError) throw updateError
          
          remainingToDeduct -= deductFromThisRecord
        }
      }
      
      if (remainingToDeduct > 0) {
        throw new Error('Insufficient inventory to complete the sale')
      }
    }
  }
}
</script>

<style scoped>

</style>