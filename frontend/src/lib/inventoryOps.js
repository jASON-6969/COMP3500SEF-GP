import supabase from './supabase'

export function sanitizeStorageValue(storage) {
  if (storage === '' || storage === null || storage === undefined) {
    return null
  }
  return storage
}

export async function getInventoryRecordId({ store, product, color, storage }) {
  const { name, location } = store
  let query = supabase
    .from('inventory')
    .select('id')
    .eq('name', name)
    .eq('location', location)
    .ilike('product', product)
    .ilike('color', color)

  const sanitizedStorage = sanitizeStorageValue(storage)
  if (sanitizedStorage !== null) {
    const storageNumber = Number(sanitizedStorage)
    query = Number.isNaN(storageNumber)
      ? query.eq('storage', String(sanitizedStorage))
      : query.eq('storage', storageNumber)
  } else {
    query = query.or('storage.is.null,storage.eq.')
  }

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error(`No inventory record found for ${product} ${color} ${storage ? storage + 'GB' : 'no storage'}`)
  }
  return data[0].id
}

export async function deductInventory({ store, product, color, storage }, quantity) {
  const { name, location } = store
  let query = supabase
    .from('inventory')
    .select('*')
    .eq('name', name)
    .eq('location', location)
    .ilike('product', product)
    .ilike('color', color)

  const sanitizedStorage = sanitizeStorageValue(storage)
  if (sanitizedStorage !== null) {
    const storageNumber = Number(sanitizedStorage)
    query = Number.isNaN(storageNumber)
      ? query.eq('storage', String(sanitizedStorage))
      : query.eq('storage', storageNumber)
  } else {
    query = query.or('storage.is.null,storage.eq.')
  }

  const { data: records, error: fetchError } = await query
  if (fetchError) throw fetchError
  if (!records || records.length === 0) {
    throw new Error(`No inventory records found for ${product} ${color} ${storage ? storage + 'GB' : 'no storage'}`)
  }

  let totalAvailable = 0
  for (const record of records) {
    totalAvailable += Number(record.quantity) || 0
  }
  if (totalAvailable < quantity) {
    throw new Error(`Insufficient inventory. Available: ${totalAvailable}, Required: ${quantity}`)
  }

  let remaining = quantity
  for (const record of records) {
    if (remaining <= 0) break
    const currentQuantity = Number(record.quantity) || 0
    const deduct = Math.min(remaining, currentQuantity)
    if (deduct > 0) {
      const newQuantity = currentQuantity - deduct
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', record.id)
        .eq('name', record.name)
        .eq('location', record.location)
      if (updateError) throw updateError
      remaining -= deduct
    }
  }

  if (remaining > 0) {
    throw new Error('Insufficient inventory to complete the sale')
  }
}

export default {
  sanitizeStorageValue,
  getInventoryRecordId,
  deductInventory
}


