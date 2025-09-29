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
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export default {
  createSale,
  fetchSales
}
