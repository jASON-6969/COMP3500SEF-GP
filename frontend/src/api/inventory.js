import supabase from '../lib/supabase'

const TABLE_NAME = 'inventory'

export async function fetchDistinctStores() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('name, location')
    .not('name', 'is', null)
    .not('location', 'is', null)

  if (error) throw error

  const seen = new Set()
  const stores = []
  const collapse = s => String(s).trim().replace(/\s+/g, ' ')
  for (const row of data) {
    const name = collapse(row.name)
    const location = collapse(row.location)
    const key = `${name.toLowerCase()}__${location.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      stores.push({
        name,
        location,
        label: `${name} — ${location}`
      })
    }
  }
  return stores.sort((a, b) => a.label.localeCompare(b.label))
}

// New: fetch distinct products across all stores
export async function fetchDistinctProducts() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('product')
    .not('product', 'is', null)

  if (error) throw error

  const set = new Set((data || []).map(r => String(r.product).trim().toLowerCase()))
  return Array.from(set).sort()
}

// New: fetch distinct colors across all stores for a given product
export async function fetchColorsByProduct(product) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('color')
    .ilike('product', product)
    .not('color', 'is', null)

  if (error) throw error

  const set = new Set((data || []).map(r => String(r.color).trim().toLowerCase()))
  return Array.from(set).sort()
}

// New: fetch distinct storages across all stores for a given product+color
export async function fetchStoragesByProductColor(product, color) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('storage')
    .ilike('product', product)
    .ilike('color', color)
    .not('storage', 'is', null)

  if (error) throw error

  const set = new Set((data || []).map(r => String(r.storage).trim()))
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
}

// New: fetch stores for a given product/color/storage with availability flag
export async function fetchStoresByProductColorStorage(product, color, storage) {
  let query = supabase
    .from(TABLE_NAME)
    .select('name, location, quantity')
    .ilike('product', product)
    .ilike('color', color)

  if (storage !== undefined && storage !== null && storage !== '') {
    const storageNumber = Number(storage)
    query = Number.isNaN(storageNumber)
      ? query.eq('storage', String(storage))
      : query.eq('storage', storageNumber)
  } else {
    query = query.or('storage.is.null,storage.eq.0')
  }

  const { data, error } = await query

  if (error) throw error

  const collapse = s => String(s).trim().replace(/\s+/g, ' ')
  const aggregate = new Map()
  for (const row of data || []) {
    const name = collapse(row.name)
    const location = collapse(row.location)
    const key = `${name.toLowerCase()}__${location.toLowerCase()}`
    const prev = aggregate.get(key) || 0
    const n = Number(row.quantity)
    aggregate.set(key, prev + (Number.isNaN(n) ? 0 : n))
  }

  const results = []
  for (const [key, total] of aggregate.entries()) {
    const [nameLower, locationLower] = key.split('__')
    // We need to restore the original case by finding it from the original data
    const originalRow = data.find(row => 
      collapse(row.name).toLowerCase() === nameLower && 
      collapse(row.location).toLowerCase() === locationLower
    )
    const name = originalRow ? collapse(originalRow.name) : nameLower
    const location = originalRow ? collapse(originalRow.location) : locationLower
    const available = total > 0
    const baseLabel = `${name} — ${location}`
    const label = available ? baseLabel : `(no available) ${baseLabel}`
    results.push({ name, location, label, available })
  }
  return results.sort((a, b) => a.label.localeCompare(b.label))
}

export async function fetchProductsByStore(store) {
  const { name, location } = store
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('product')
    .eq('name', name)
    .eq('location', location)
    .not('product', 'is', null)

  if (error) throw error

  const set = new Set(data.map(r => String(r.product).trim().toLowerCase()))
  return Array.from(set).sort()
}

export async function fetchColorsByStoreAndProduct(store, product) {
  const { name, location } = store
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('color')
    .eq('name', name)
    .eq('location', location)
    .ilike('product', product)
    .not('color', 'is', null)

  if (error) throw error

  const set = new Set(data.map(r => String(r.color).trim().toLowerCase()))
  return Array.from(set).sort()
}

export async function fetchStoragesByStoreProductColor(store, product, color) {
  const { name, location } = store
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('storage')
    .eq('name', name)
    .eq('location', location)
    .ilike('product', product)
    .ilike('color', color)
    .not('storage', 'is', null)

  if (error) throw error

  const set = new Set(
    (data || []).map(r => String(r.storage).trim())
  )
  // sort numeric ascending when possible
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
}

export async function fetchQuantitySum(store, product, color, storage) {
  const { name, location } = store
  let query = supabase
    .from(TABLE_NAME)
    .select('quantity')
    .eq('name', name)
    .eq('location', location)
    .ilike('product', product)
    .ilike('color', color)

  if (storage !== undefined && storage !== null && storage !== '') {
    const storageNumber = Number(storage)
    query = Number.isNaN(storageNumber)
      ? query.eq('storage', String(storage))
      : query.eq('storage', storageNumber)
  } else {
    // If no storage specified, match records where storage is null or 0
    query = query.or('storage.is.null,storage.eq.0')
  }

  const { data, error } = await query

  if (error) throw error

  let total = 0
  for (const row of data || []) {
    const n = Number(row.quantity)
    if (!Number.isNaN(n)) total += n
  }
  return total
}

export async function fetchPrice(store, product, color, storage) {
  const { name, location } = store
  let query = supabase
    .from(TABLE_NAME)
    .select('price')
    .eq('name', name)
    .eq('location', location)
    .ilike('product', product)
    .ilike('color', color)

  if (storage !== undefined && storage !== null && storage !== '') {
    const storageNumber = Number(storage)
    query = Number.isNaN(storageNumber)
      ? query.eq('storage', String(storage))
      : query.eq('storage', storageNumber)
  } else {
    // If no storage specified, match records where storage is null or 0
    query = query.or('storage.is.null,storage.eq.0')
  }

  const { data, error } = await query

  if (error) throw error

  // 返回第一個找到的價格，如果沒有則返回 null
  if (data && data.length > 0) {
    return data[0].price
  }
  return null
}

export default {
  fetchDistinctStores,
  fetchDistinctProducts,
  fetchColorsByProduct,
  fetchStoragesByProductColor,
  fetchStoresByProductColorStorage,
  fetchProductsByStore,
  fetchColorsByStoreAndProduct,
  fetchStoragesByStoreProductColor,
  fetchQuantitySum,
  fetchPrice
}


