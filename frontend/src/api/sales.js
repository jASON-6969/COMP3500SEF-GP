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
  // 输入验证
  if (!Array.isArray(data)) {
    console.warn('calculateDailyRevenue: 输入数据不是数组')
    return []
  }
  
  if (data.length === 0) {
    return []
  }
  
  const dailyMap = new Map()
  
  try {
    data.forEach((record, index) => {
      // 验证记录格式
      if (!record || typeof record !== 'object') {
        console.warn(`calculateDailyRevenue: 跳过无效记录 at index ${index}`)
        return
      }
      
      // 验证时间字段
      if (!record.time) {
        console.warn(`calculateDailyRevenue: 记录缺少时间字段 at index ${index}`)
        return
      }
      
      // 解析日期并验证
      const date = new Date(record.time)
      if (isNaN(date.getTime())) {
        console.warn(`calculateDailyRevenue: 无效的时间格式 at index ${index}: ${record.time}`)
        return
      }
      
      // 获取日期键 (YYYY-MM-DD 格式)
      const dateKey = date.toISOString().split('T')[0]
      
      // 验证价格字段
      const price = parseFloat(record.price) || 0
      if (price < 0) {
        console.warn(`calculateDailyRevenue: 负价格值 at index ${index}: ${record.price}`)
      }
      
      // 累加收入
      const currentRevenue = dailyMap.get(dateKey) || 0
      dailyMap.set(dateKey, currentRevenue + price)
    })
    
    // 转换为数组并排序
    const result = Array.from(dailyMap.entries())
      .map(([date, revenue]) => ({ 
        date, 
        revenue: Math.round(revenue * 100) / 100 // 保留两位小数
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return result
    
  } catch (error) {
    console.error('calculateDailyRevenue: 处理数据时发生错误:', error)
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

export default {
  createSale,
  fetchSales,
  fetchSalesWithFilters,
  fetchDistinctProducts,
  fetchDistinctStoreNames,
  fetchSalesStats
}
