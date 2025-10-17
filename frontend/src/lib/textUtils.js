/**
 * 将字符串的首字母大写
 * @param {string} str - 要处理的字符串
 * @returns {string} - 首字母大写的字符串
 */
export function capitalizeFirstLetter(str) {
  if (!str || typeof str !== 'string') {
    return str
  }
  
  // 处理空字符串或只有空格的字符串
  const trimmed = str.trim()
  if (!trimmed) {
    return str
  }
  
  // 特殊处理iPhone和iPad
  const lowerStr = trimmed.toLowerCase()
  if (lowerStr === 'iphone') {
    return 'iPhone'
  }
  if (lowerStr === 'ipad') {
    return 'iPad'
  }
  
  // 将首字母大写，其余字母保持原样
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * 将字符串数组中的每个字符串首字母大写
 * @param {string[]} arr - 字符串数组
 * @returns {string[]} - 首字母大写的字符串数组
 */
export function capitalizeFirstLetterArray(arr) {
  if (!Array.isArray(arr)) {
    return arr
  }
  
  return arr.map(item => capitalizeFirstLetter(item))
}

/**
 * 将对象中的指定字段首字母大写
 * @param {Object} obj - 要处理的对象
 * @param {string[]} fields - 要处理的字段名数组
 * @returns {Object} - 处理后的对象
 */
export function capitalizeObjectFields(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  
  const result = { ...obj }
  
  fields.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = capitalizeFirstLetter(result[field])
    }
  })
  
  return result
}

export default {
  capitalizeFirstLetter,
  capitalizeFirstLetterArray,
  capitalizeObjectFields
}
