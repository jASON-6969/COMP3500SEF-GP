<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <h1 class="text-h4">Inventory</h1>
          </v-card-title>
          <v-card-text>
            <v-row class="mb-4" dense>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="idFilter"
                  label="ID"
                  clearable
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="productFilter"
                  label="Product"
                  clearable
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="nameFilter"
                  label="Store Name"
                  clearable
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="locationFilter"
                  label="Store Location"
                  clearable
                  density="comfortable"
                />
              </v-col>
            </v-row>
            <v-data-table
              :headers='headers'
              :items='filteredProducts'
              v-model:sort-by="sortBy"
            >
              <template #[`item.price`]="{ item }">
                <span v-if="item.price !== null && item.price !== undefined">
                  ${{ item.price }}
                </span>
                <span v-else>-</span>
              </template>
            </v-data-table>
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
        {title: 'Price', value: 'price'},
        {title: 'Store Name', value: 'name'},
        {title: 'Store Location', value: 'location'},
        {title: 'Update Time', value: 'UpdateTime'},
      ],
      products: [],
      // filters
      idFilter: '',
      productFilter: '',
      nameFilter: '',
      locationFilter: '',
      // initial sort by store name ascending
      sortBy: [{ key: 'name', order: 'asc' }]
    };
  },
  computed: {
    filteredProducts(){
      const idQ = String(this.idFilter || '').trim().toLowerCase()
      const productQ = String(this.productFilter || '').trim().toLowerCase()
      const nameQ = String(this.nameFilter || '').trim().toLowerCase()
      const locationQ = String(this.locationFilter || '').trim().toLowerCase()

      if (!idQ && !productQ && !nameQ && !locationQ) return this.products

      return (this.products || []).filter((row) => {
        const idStr = row && row.id !== undefined && row.id !== null ? String(row.id).toLowerCase() : ''
        const productStr = row && row.product ? String(row.product).toLowerCase() : ''
        const nameStr = row && row.name ? String(row.name).toLowerCase() : ''
        const locationStr = row && row.location ? String(row.location).toLowerCase() : ''

        const idOk = !idQ || idStr.includes(idQ)
        const productOk = !productQ || productStr.includes(productQ)
        const nameOk = !nameQ || nameStr.includes(nameQ)
        const locationOk = !locationQ || locationStr.includes(locationQ)

        return idOk && productOk && nameOk && locationOk
      })
    }
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
