<template>
  <v-app>
    <v-app-bar
      color="primary"
      dark
      prominent
    >
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        color="white"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>Distributed Inventory and Sales Management System</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      temporary
      color="primary"
      dark
    >
      <v-list>
        <v-list-item
          :to="{ name: 'Selling' }"
          prepend-icon="mdi-cash-register"
          title="Selling"
          @click="drawer = false"
        ></v-list-item>
        <v-list-item
          :to="{ name: 'Inventory' }"
          prepend-icon="mdi-warehouse"
          title="Inventory"
          @click="drawer = false"
        ></v-list-item>
        <v-list-item
          :to="{ name: 'SalesRecord' }"
          prepend-icon="mdi-chart-line"
          title="Sales Record"
          @click="drawer = false"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      drawer: false
    }
  }
}
</script>

<style>

</style>
