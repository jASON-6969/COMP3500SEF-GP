import supabase from '../lib/supabase'
import { calculateDailyRevenue, calculateMonthlyRevenue } from '../lib/revenueUtils'

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
    .select('price, quantity, time')

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

  // Calculate daily and monthly revenue
  const dailyRevenue = calculateDailyRevenue(data)
  const monthlyRevenue = calculateMonthlyRevenue(data)

  return {
    totalRecords,
    totalRevenue,
    totalQuantity,
    dailyRevenue,
    monthlyRevenue
  }
}

// 使用统一的工具函数，移除重复代码

export async function fetchSalesRanking(filters = {}) {
  let query = supabase
    .from(TABLE_NAME)
    .select('product, price, quantity, name, time')

  // Apply date filtering
  if (filters.dateRange && filters.dateRange.length === 2) {
    const startDate = new Date(filters.dateRange[0])
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(filters.dateRange[1])
    endDate.setHours(23, 59, 59, 999)
    
    query = query
      .gte('time', startDate.toISOString())
      .lte('time', endDate.toISOString())
  }

  // Apply product filtering
  if (filters.products && filters.products.length > 0) {
    query = query.in('product', filters.products)
  }

  // Apply store filtering
  if (filters.stores && filters.stores.length > 0) {
    query = query.in('name', filters.stores)
  }

  const { data, error } = await query

  if (error) throw error

  // Process data to create ranking
  const productStats = new Map()
  
  data.forEach(record => {
    const product = record.product
    const price = parseFloat(record.price) || 0
    const quantity = parseInt(record.quantity) || 0
    const store = record.name
    
    if (!productStats.has(product)) {
      productStats.set(product, {
        product,
        totalRevenue: 0,
        totalQuantity: 0,
        stores: new Set(),
        prices: []
      })
    }
    
    const stats = productStats.get(product)
    stats.totalRevenue += price
    stats.totalQuantity += quantity
    stats.stores.add(store)
    stats.prices.push(price / quantity) // Calculate unit price
  })

  // Convert to array and calculate additional metrics
  let ranking = Array.from(productStats.values()).map(stats => ({
    product: stats.product,
    totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
    totalQuantity: stats.totalQuantity,
    storeCount: stats.stores.size,
    averagePrice: stats.prices.length > 0 
      ? Math.round((stats.prices.reduce((sum, price) => sum + price, 0) / stats.prices.length) * 100) / 100
      : 0
  }))

  // Sort by the specified criteria
  const sortBy = filters.sortBy || 'revenue'
  switch (sortBy) {
    case 'revenue':
      ranking.sort((a, b) => b.totalRevenue - a.totalRevenue)
      break
    case 'quantity':
      ranking.sort((a, b) => b.totalQuantity - a.totalQuantity)
      break
    case 'stores':
      ranking.sort((a, b) => b.storeCount - a.storeCount)
      break
    case 'price':
      ranking.sort((a, b) => b.averagePrice - a.averagePrice)
      break
    default:
      ranking.sort((a, b) => b.totalRevenue - a.totalRevenue)
  }

  // Apply limit
  const limit = parseInt(filters.limit) || 10
  ranking = ranking.slice(0, limit)

  return {
    ranking,
    total: productStats.size
  }
}

export default {
  createSale,
  fetchSales,
  fetchSalesWithFilters,
  fetchDistinctProducts,
  fetchDistinctStoreNames,
  fetchSalesStats,
  fetchSalesRanking
}
