<template>
  <v-card class="mt-4" elevation="2">
    <v-card-title>
      Cart
      <v-spacer />
      <v-btn class="mr-2" color="primary" variant="text" :disabled="items.length === 0 || loading" @click="$emit('refresh-prices')">Refresh Prices</v-btn>
      <v-btn color="error" variant="text" :disabled="items.length === 0" @click="$emit('clear')">Clear</v-btn>
    </v-card-title>
    <v-card-text>
      <div v-if="items.length === 0" class="text-body-2">Cart is empty</div>
      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Product</th>
            <th class="text-left">Color</th>
            <th class="text-left">Storage</th>
            <th class="text-left" v-if="hasEstimates">Unit Price</th>
            <th class="text-left" v-if="hasEstimates">Subtotal</th>
            <th class="text-left" style="width: 140px;">Qty</th>
            <th class="text-left" style="width: 80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.key">
            <td>{{ item.product }}</td>
            <td>{{ item.color }}</td>
            <td>{{ item.storage || '-' }}</td>
            <td v-if="hasEstimates">{{ displayUnitPrice(item.key) }}</td>
            <td v-if="hasEstimates">{{ displaySubtotal(item.key, item.quantity) }}</td>
            <td>
              <v-text-field
                type="number"
                min="1"
                density="compact"
                variant="outlined"
                hide-details
                :model-value="item.quantity"
                @update:model-value="v => onUpdateQty(item.key, v)"
              />
            </td>
            <td>
              <v-btn color="error" variant="text" icon="mdi-delete" @click="$emit('remove-item', item.key)" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div class="mt-4 d-flex align-center">
        <div class="text-body-2 mr-2">
          Prices are estimated and finalized at checkout
          <span v-if="hasEstimates && totalEstimate !== null"> — Estimated Total: {{ displayCurrency(totalEstimate) }}</span>
        </div>
        <v-spacer />
        <v-btn color="primary" :disabled="items.length === 0 || loading" :loading="loading" @click="$emit('checkout')">Checkout Cart</v-btn>
      </div>
      <v-alert v-if="message" :type="messageType" class="mt-3">{{ message }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'CartPanel',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    estimates: {
      type: Object,
      default: null
    },
    totalEstimate: {
      type: Number,
      default: null
    },
    message: {
      type: String,
      default: ''
    },
    messageType: {
      type: String,
      default: 'success'
    }
  },
  emits: ['update-qty', 'remove-item', 'clear', 'checkout', 'refresh-prices'],
  computed: {
    hasEstimates() {
      return !!this.estimates
    }
  },
  methods: {
    onUpdateQty(key, value) {
      const n = parseInt(value, 10)
      this.$emit('update-qty', { key, quantity: Number.isNaN(n) ? 1 : n })
    },
    displayCurrency(n) {
      const num = Number(n) || 0
      return `$${num.toFixed(2)}`
    },
    displayUnitPrice(key) {
      if (!this.estimates || this.estimates[key] === undefined || this.estimates[key] === null) return '-'
      return this.displayCurrency(this.estimates[key])
    },
    displaySubtotal(key, qty) {
      if (!this.estimates || this.estimates[key] === undefined || this.estimates[key] === null) return '-'
      const unit = Number(this.estimates[key]) || 0
      const q = Number(qty) || 0
      return this.displayCurrency(unit * q)
    }
  }
}
</script>

<style scoped>

</style>


