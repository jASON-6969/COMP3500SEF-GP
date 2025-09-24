<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <h1 class="text-h4">selling</h1>
          </v-card-title>
          <v-card-text>
            <InventorySearchPanel @change="onSelectionChange" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import InventorySearchPanel from '../components/InventorySearchPanel.vue'
export default {
  name: 'SellingPage',
  components: { InventorySearchPanel },
  methods: {
    onSelectionChange(payload) {
      // eslint-disable-next-line no-console
      console.log('Selection changed', payload)
    }
  }
}
</script>

<style scoped>

</style>
