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
  for (const row of data) {
    const key = `${row.name}__${row.location}`
    if (!seen.has(key)) {
      seen.add(key)
      stores.push({
        name: row.name,
        location: row.location,
        label: `${row.name} — ${row.location}`
      })
    }
  }
  return stores
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

  if (storage !== undefined && storage !== null && String(storage).length > 0) {
    const storageNumber = Number(storage)
    query = Number.isNaN(storageNumber)
      ? query.eq('storage', String(storage))
      : query.eq('storage', storageNumber)
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

  if (storage !== undefined && storage !== null && String(storage).length > 0) {
    const storageNumber = Number(storage)
    query = Number.isNaN(storageNumber)
      ? query.eq('storage', String(storage))
      : query.eq('storage', storageNumber)
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
  fetchProductsByStore,
  fetchColorsByStoreAndProduct,
  fetchStoragesByStoreProductColor,
  fetchQuantitySum,
  fetchPrice
}


