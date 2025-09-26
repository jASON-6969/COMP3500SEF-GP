<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <h1 class="text-h4">Inventory</h1>
          </v-card-title>
          <v-card-text>
            <v-data-table :headers = 'headers' :items = 'products'></v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import supabase from '../lib/supabase'

const TABLE_NAME = 'inventory'

export default {
  name: 'InventoryPage',
  data(){
    return {
      headers:[
        {title: 'ID', value: 'id'},
        {title: 'Product', value: 'product'},
        {title: 'Color', value: 'color'},
        {title: 'Storage', value: 'storage'},
        {title: 'Stock Quantity', value: 'quantity'},
        {title: 'Store Name', value: 'name'},
        {title: 'Store Location', value: 'location'},
        {title: 'Update Time', value: 'UpdateTime'},
      ],
      products: []
    };
  },
  async mounted(){
    try{
      const {data, error} = await supabase
      .from (TABLE_NAME)
      .select('*');
      if (error) throw error
      this.products = data
    }catch (error){
      console.error('Error fetching data:', error)
    }
  }
}
</script>

<style scoped>

</style>
