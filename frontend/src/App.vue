<template>
  <v-app>
    <v-app-bar
      color="primary"
      dark
      prominent
    >
      <v-toolbar-title>Distributed Inventory and Sales Management System</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- header -->
      <v-btn
        :to="{ name: 'Selling' }"
        color="white"
        variant="text"
        class="mr-2"
      >
        <v-icon left>mdi-cash-register</v-icon>
        selling
      </v-btn>
      
      <v-btn
        :to="{ name: 'Inventory' }"
        color="white"
        variant="text"
        class="mr-2"
      >
        <v-icon left>mdi-warehouse</v-icon>
        Inventory 
      </v-btn>
      
      <v-btn
        :to="{ name: 'SalesRecord' }"
        color="white"
        variant="text"
        class="mr-2"
      >
        <v-icon left>mdi-chart-line</v-icon>
        sales record
      </v-btn>
      
      <v-btn icon>
        <v-icon>mdi-account</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>

</style>
