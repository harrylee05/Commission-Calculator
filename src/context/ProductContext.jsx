import { createContext, useContext, useState, useEffect } from 'react'

const ProductContext = createContext(null)

const STORAGE_KEY = 'commissionpro_products'

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  function addProduct(product) {
    const newProduct = { ...product, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setProducts(prev => [newProduct, ...prev])
    return newProduct.id
  }

  function updateProduct(id, updates) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  function deleteProduct(id) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  return useContext(ProductContext)
}
