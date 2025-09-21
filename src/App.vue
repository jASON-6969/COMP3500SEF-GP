<template>
  <v-app>
    <v-app-bar
      color="primary"
      dark
      prominent
    >
      <v-toolbar-title>Distributed Inventory and Sales Management System</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-account</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>
                <h1 class="text-h4">Distributed Inventory and Sales Management System</h1>
              </v-card-title>
              <v-card-text>
                <p class="text-h6">based on Vue.js and Vuetify</p>
                <v-btn color="primary" class="mt-4">
                  start
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
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
