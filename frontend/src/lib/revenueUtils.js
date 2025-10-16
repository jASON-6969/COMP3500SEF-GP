/**
 * Revenue Analysis Utilities
 * 统一处理Revenue分析相关的数据计算和转换
 */

/**
 * 时区偏移常量 - 数据库使用UTC，需要转换为本地时间
 */
const TIMEZONE_OFFSET_HOURS = 8

/**
 * 应用时区偏移到日期
 * @param {Date} date - 原始日期
 * @returns {Date} 调整后的日期
 */
export function applyTimezoneOffset(date) {
  return new Date(date.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000)
}

/**
 * 计算日收入数据
 * @param {Array} salesData - 销售数据数组
 * @returns {Array} 日收入数据数组
 */
export function calculateDailyRevenue(salesData) {
  if (!Array.isArray(salesData) || salesData.length === 0) {
    return []
  }
  
  const dailyMap = new Map()
  
  salesData.forEach((record, index) => {
    if (!record || !record.time) {
      console.warn(`calculateDailyRevenue: Skipping invalid record at index ${index}`)
      return
    }
    
    const date = new Date(record.time)
    if (isNaN(date.getTime())) {
      console.warn(`calculateDailyRevenue: Invalid time format at index ${index}: ${record.time}`)
      return
    }
    
    // 应用时区偏移
    const adjustedDate = applyTimezoneOffset(date)
    const dateKey = adjustedDate.toISOString().split('T')[0]
    
    const price = parseFloat(record.price) || 0
    const currentRevenue = dailyMap.get(dateKey) || 0
    dailyMap.set(dateKey, currentRevenue + price)
  })
  
  return Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ 
      date, 
      revenue: Math.round(revenue * 100) / 100
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

/**
 * 计算月收入数据
 * @param {Array} salesData - 销售数据数组
 * @returns {Array} 月收入数据数组
 */
export function calculateMonthlyRevenue(salesData) {
  if (!Array.isArray(salesData) || salesData.length === 0) {
    return []
  }
  
  const monthlyMap = new Map()
  
  salesData.forEach(record => {
    if (!record || !record.time) return
    
    const date = new Date(record.time)
    if (isNaN(date.getTime())) return
    
    // 应用时区偏移
    const adjustedDate = applyTimezoneOffset(date)
    const monthKey = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, '0')}`
    
    const price = parseFloat(record.price) || 0
    const currentRevenue = monthlyMap.get(monthKey) || 0
    monthlyMap.set(monthKey, currentRevenue + price)
  })
  
  return Array.from(monthlyMap.entries())
    .map(([month, revenue]) => ({ 
      month, 
      revenue: Math.round(revenue * 100) / 100
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * 计算指定日期的小时收入数据
 * @param {Array} salesData - 销售数据数组
 * @param {string} selectedDate - 选择的日期 (YYYY-MM-DD格式)
 * @returns {Array} 小时收入数据数组
 */
export function calculateHourlyRevenue(salesData, selectedDate) {
  if (!Array.isArray(salesData) || salesData.length === 0 || !selectedDate) {
    return []
  }
  
  const selectedDateObj = new Date(selectedDate)
  const startOfDay = new Date(selectedDateObj)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(selectedDateObj)
  endOfDay.setHours(23, 59, 59, 999)
  
  // 过滤出指定日期的数据
  const dayData = salesData.filter(item => {
    if (!item.time) return false
    const itemDate = new Date(item.time)
    const adjustedItemDate = applyTimezoneOffset(itemDate)
    return adjustedItemDate >= startOfDay && adjustedItemDate <= endOfDay
  })
  
  // 初始化24小时数据
  const hourlyMap = new Map()
  for (let hour = 0; hour < 24; hour++) {
    hourlyMap.set(hour, 0)
  }
  
  // 计算每小时收入
  dayData.forEach(item => {
    if (!item.time) return
    
    const itemDate = new Date(item.time)
    const adjustedItemDate = applyTimezoneOffset(itemDate)
    const hour = adjustedItemDate.getHours()
    const revenue = parseFloat(item.price) || 0
    
    if (hour >= 0 && hour <= 23) {
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + revenue)
    }
  })
  
  return Array.from(hourlyMap.entries())
    .map(([hour, revenue]) => ({
      hour: hour,
      revenue: Math.round(revenue * 100) / 100
    }))
    .sort((a, b) => a.hour - b.hour)
}

/**
 * 格式化日期为显示格式
 * @param {string} dateString - 日期字符串
 * @param {string} format - 格式类型 ('date' | 'datetime')
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateString, format = 'date') {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const adjustedDate = applyTimezoneOffset(date)
  
  if (format === 'datetime') {
    return adjustedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }
  
  return adjustedDate.toLocaleDateString('en-US')
}

/**
 * 检查数据是否为聚合数据
 * @param {Array} data - 数据数组
 * @returns {boolean} 是否为聚合数据
 * @deprecated 此函数已简化，不再需要复杂的聚合数据检测
 */
export function isAggregatedData(data) {
  // 简化逻辑：如果数据有revenue字段且没有time字段，则认为是聚合数据
  if (!Array.isArray(data) || data.length === 0) return false
  return data.some(item => item.revenue && !item.time)
}

/**
 * 获取图表标签
 * @param {Array} data - 数据数组
 * @param {string} type - 图表类型 ('daily' | 'monthly')
 * @returns {Array} 标签数组
 */
export function getChartLabels(data, type) {
  if (!Array.isArray(data) || data.length === 0) return []
  
  return data.map(item => {
    if (type === 'daily') {
      const dateStr = item.date || item.time
      if (!dateStr) return 'Invalid Date'
      
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Invalid Date'
      
      const adjustedDate = applyTimezoneOffset(date)
      return adjustedDate.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      })
    } else {
      return item.month || 'Unknown Month'
    }
  })
}

/**
 * 获取图表数据
 * @param {Array} data - 数据数组
 * @returns {Array} 数据数组
 */
export function getChartData(data) {
  if (!Array.isArray(data) || data.length === 0) return []
  
  return data.map(item => {
    const revenue = parseFloat(item.revenue || item.price || 0)
    return isNaN(revenue) ? 0 : revenue
  })
}
