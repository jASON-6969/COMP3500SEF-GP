import supabase from '../lib/supabase'

const TABLE_NAME = 'inventory'

export async function fetchDistinctStores() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('name, location')
    .neq('name', null)
    .neq('location', null)

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
    .neq('product', null)

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
    .neq('color', null)

  if (error) throw error

  const set = new Set(data.map(r => String(r.color).trim().toLowerCase()))
  return Array.from(set).sort()
}

export async function fetchQuantitySum(store, product, color) {
  const { name, location } = store
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('quantity')
    .eq('name', name)
    .eq('location', location)
    .ilike('product', product)
    .ilike('color', color)

  if (error) throw error

  let total = 0
  for (const row of data || []) {
    const n = Number(row.quantity)
    if (!Number.isNaN(n)) total += n
  }
  return total
}

export default {
  fetchDistinctStores,
  fetchProductsByStore,
  fetchColorsByStoreAndProduct,
  fetchQuantitySum
}


