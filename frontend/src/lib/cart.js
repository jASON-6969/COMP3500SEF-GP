// Shopping cart persistence and operation utilities

const CART_STORAGE_KEY = 'app_cart'

function normalizeStorageKey(storage) {
  if (storage === undefined || storage === null || storage === '') return 'NULL'
  return String(storage)
}

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return { store: null, items: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { store: null, items: [] }
    return { store: parsed.store || null, items: Array.isArray(parsed.items) ? parsed.items : [] }
  } catch (e) {
    return { store: null, items: [] }
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

export function clearCart() {
  const empty = { store: null, items: [] }
  saveCart(empty)
  return empty
}

export function getCartStore(cart) {
  return cart && cart.store ? cart.store : null
}

export function addItem(cart, store, line) {
  // Same store restriction
  if (cart.items.length > 0) {
    const { name, location } = cart.store || {}
    if (!store || store.name !== name || store.location !== location) {
      return { cart, error: 'Cart only allows items from the same store.' }
    }
  }

  const storageKey = normalizeStorageKey(line.storage)
  const key = `${String(line.product).toLowerCase()}|${String(line.color).toLowerCase()}|${storageKey}`

  const next = { store: cart.items.length === 0 ? store : cart.store, items: [...cart.items] }

  const idx = next.items.findIndex(i => i.key === key)
  if (idx >= 0) {
    const existing = next.items[idx]
    next.items.splice(idx, 1, { ...existing, quantity: Number(existing.quantity) + Number(line.quantity) })
  } else {
    next.items.push({
      key,
      product: line.product,
      color: line.color,
      storage: line.storage,
      quantity: Number(line.quantity)
    })
  }

  saveCart(next)
  return { cart: next }
}

export function updateQuantity(cart, lineKey, quantity) {
  const qty = Math.max(0, Number(quantity) || 0)
  const next = { store: cart.store, items: cart.items.map(i => (i.key === lineKey ? { ...i, quantity: qty } : i)) }
  // Remove items with 0 quantity
  const filtered = { store: next.store, items: next.items.filter(i => i.quantity > 0) }
  if (filtered.items.length === 0) filtered.store = null
  saveCart(filtered)
  return filtered
}

export function removeItem(cart, lineKey) {
  const next = { store: cart.store, items: cart.items.filter(i => i.key !== lineKey) }
  if (next.items.length === 0) next.store = null
  saveCart(next)
  return next
}

export default {
  loadCart,
  saveCart,
  clearCart,
  getCartStore,
  addItem,
  updateQuantity,
  removeItem
}


