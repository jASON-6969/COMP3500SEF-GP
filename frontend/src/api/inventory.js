import supabase from '../lib/supabase'
import { capitalizeFirstLetter } from '../lib/textUtils'

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
    const name = capitalizeFirstLetter(collapse(row.name))
    const location = capitalizeFirstLetter(collapse(row.location))
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

  const set = new Set((data || []).map(r => capitalizeFirstLetter(String(r.product).trim().toLowerCase())))
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

  const set = new Set((data || []).map(r => capitalizeFirstLetter(String(r.color).trim().toLowerCase())))
  return Array.from(set).sort()
}

// New: fetch distinct storages across all stores for a given product+color
// Includes null values as a valid option
export async function fetchStoragesByProductColor(product, color) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('storage')
    .ilike('product', product)
    .ilike('color', color)

  if (error) throw error

  // Process storage values, keeping null as a distinct option
  const set = new Set()
  for (const row of (data || [])) {
    if (row.storage === null || row.storage === undefined) {
      set.add(null)
    } else {
      set.add(String(row.storage).trim())
    }
  }
  
  // Sort: null first, then numeric values
  const result = Array.from(set)
  return result.sort((a, b) => {
    if (a === null) return -1
    if (b === null) return 1
    return Number(a) - Number(b)
  })
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
    const name = originalRow ? capitalizeFirstLetter(collapse(originalRow.name)) : capitalizeFirstLetter(nameLower)
    const location = originalRow ? capitalizeFirstLetter(collapse(originalRow.location)) : capitalizeFirstLetter(locationLower)
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

  const set = new Set(data.map(r => capitalizeFirstLetter(String(r.product).trim().toLowerCase())))
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

  const set = new Set(data.map(r => capitalizeFirstLetter(String(r.color).trim().toLowerCase())))
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

  // Return the first found price, or null if none found
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


