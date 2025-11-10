import { describe, it, expect, beforeEach } from 'vitest'
import { loadCart, clearCart, addItem } from '../src/lib/cart'

describe('cart utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadCart returns empty cart when storage empty or invalid', () => {
    localStorage.removeItem('app_cart')
    const cart = loadCart()
    expect(cart).toEqual({ store: null, items: [] })
  })

  it('addItem merges quantity for same product/color/storage key', () => {
    const initial = { store: null, items: [] }
    const store = { name: 'Store A', location: 'L1' }
    const line = { product: 'P1', color: 'Red', storage: '', quantity: 2 }

    const { cart: c1 } = addItem(initial, store, line)
    expect(c1.items).toHaveLength(1)
    expect(c1.items[0].quantity).toBe(2)
    expect(c1.store).toEqual(store)

    const { cart: c2 } = addItem(c1, store, { ...line, quantity: 3 })
    expect(c2.items).toHaveLength(1)
    expect(c2.items[0].quantity).toBe(5)
  })

  it('clearCart resets and persists empty cart', () => {
    const store = { name: 'S', location: 'L' }
    const line = { product: 'P', color: 'C', storage: null, quantity: 1 }
    const { cart } = addItem({ store: null, items: [] }, store, line)
    expect(cart.items.length).toBe(1)

    const cleared = clearCart()
    expect(cleared).toEqual({ store: null, items: [] })
    const reloaded = loadCart()
    expect(reloaded).toEqual({ store: null, items: [] })
  })
})


