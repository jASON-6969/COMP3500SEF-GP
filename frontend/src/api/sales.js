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

// Helper function to calculate daily revenue
function calculateDailyRevenue(data) {
  // Input validation
  if (!Array.isArray(data)) {
    console.warn('calculateDailyRevenue: Input data is not an array')
    return []
  }
  
  if (data.length === 0) {
    return []
  }
  
  const dailyMap = new Map()
  
  try {
    data.forEach((record, index) => {
      // Validate record format
      if (!record || typeof record !== 'object') {
        console.warn(`calculateDailyRevenue: Skipping invalid record at index ${index}`)
        return
      }
      
      // Validate time field
      if (!record.time) {
        console.warn(`calculateDailyRevenue: Record missing time field at index ${index}`)
        return
      }
      
      // Parse and validate date
      const date = new Date(record.time)
      if (isNaN(date.getTime())) {
        console.warn(`calculateDailyRevenue: Invalid time format at index ${index}: ${record.time}`)
        return
      }
      
      // Get date key (YYYY-MM-DD format)
      const dateKey = date.toISOString().split('T')[0]
      
      // Validate price field
      const price = parseFloat(record.price) || 0
      if (price < 0) {
        console.warn(`calculateDailyRevenue: Negative price value at index ${index}: ${record.price}`)
      }
      
      // Accumulate revenue
      const currentRevenue = dailyMap.get(dateKey) || 0
      dailyMap.set(dateKey, currentRevenue + price)
    })
    
    // Convert to array and sort
    const result = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ 
        date, 
        revenue: Math.round(revenue * 100) / 100 // Keep two decimal places
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return result
    
  } catch (error) {
    console.error('calculateDailyRevenue: Error processing data:', error)
    return []
  }
}

// Helper function to calculate monthly revenue
function calculateMonthlyRevenue(data) {
  const monthlyMap = new Map()
  
  data.forEach(record => {
    const date = new Date(record.time)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, monthlyMap.get(monthKey) + (record.price || 0))
    } else {
      monthlyMap.set(monthKey, record.price || 0)
    }
  })
  
  // Convert to array and sort by month
  return Array.from(monthlyMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

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
