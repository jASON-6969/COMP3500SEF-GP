import supabase from '../lib/supabase'

const TABLE_NAME = 'sales'

export async function createSale(saleData) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([saleData])
    .select()

  if (error) throw error
  return data
}

export async function fetchSales() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('time', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchSalesWithFilters(filters) {
  let query = supabase
    .from(TABLE_NAME)
    .select('*')

  // Date filtering
  if (filters.dateRange) {
    if (filters.dateRange.length === 1) {
      // Single day selection
      const startDate = new Date(filters.dateRange[0])
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(filters.dateRange[0])
      endDate.setHours(23, 59, 59, 999)
      
      query = query
        .gte('time', startDate.toISOString())
        .lte('time', endDate.toISOString())
    } else if (filters.dateRange.length === 2) {
      // Date range
      const startDate = new Date(filters.dateRange[0])
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(filters.dateRange[1])
      endDate.setHours(23, 59, 59, 999)
      
      query = query
        .gte('time', startDate.toISOString())
        .lte('time', endDate.toISOString())
    }
  }

  // Product filtering (multiple selection)
  if (filters.products && filters.products.length > 0) {
    query = query.in('product', filters.products)
  }

  // Store name filtering
  if (filters.storeNames && filters.storeNames.length > 0) {
    query = query.in('name', filters.storeNames)
  }

  // Sorting and pagination
  query = query.order('time', { ascending: false })
  
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function fetchDistinctProducts() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('product')
    .order('product')

  if (error) throw error
  
  // Remove duplicates and return product list
  const uniqueProducts = [...new Set(data.map(item => item.product))]
  return uniqueProducts
}

export async function fetchDistinctStoreNames() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('name')
    .order('name')

  if (error) throw error
  
  // Remove duplicates and return store names list
  const uniqueStoreNames = [...new Set(data.map(item => item.name))]
  return uniqueStoreNames
}

export async function fetchSalesStats(filters = {}) {
  let query = supabase
    .from(TABLE_NAME)
    .select('price, quantity')

  // Apply the same filter conditions
  if (filters.dateRange) {
    if (filters.dateRange.length === 1) {
      const startDate = new Date(filters.dateRange[0])
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(filters.dateRange[0])
      endDate.setHours(23, 59, 59, 999)
      
      query = query
        .gte('time', startDate.toISOString())
        .lte('time', endDate.toISOString())
    } else if (filters.dateRange.length === 2) {
      const startDate = new Date(filters.dateRange[0])
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(filters.dateRange[1])
      endDate.setHours(23, 59, 59, 999)
      
      query = query
        .gte('time', startDate.toISOString())
        .lte('time', endDate.toISOString())
    }
  }

  if (filters.products && filters.products.length > 0) {
    query = query.in('product', filters.products)
  }

  if (filters.storeNames && filters.storeNames.length > 0) {
    query = query.in('name', filters.storeNames)
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate statistics
  const totalRecords = data.length
  const totalRevenue = data.reduce((sum, record) => sum + (record.price || 0), 0)
  const totalQuantity = data.reduce((sum, record) => sum + (record.quantity || 0), 0)

  return {
    totalRecords,
    totalRevenue,
    totalQuantity
  }
}

export default {
  createSale,
  fetchSales,
  fetchSalesWithFilters,
  fetchDistinctProducts,
  fetchDistinctStoreNames,
  fetchSalesStats
}
