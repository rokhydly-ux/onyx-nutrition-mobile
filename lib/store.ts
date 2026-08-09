import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  image_url?: string;
  price: number;
  quantity: number;
  categorie_nom?: string;
}

interface ShopStore {
  shopCart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useShopStore = create<ShopStore>((set) => ({
  shopCart: [],
  addToCart: (product) => set((state) => {
    const existing = state.shopCart.find(item => item.id === product.id);
    if (existing) {
      return {
        shopCart: state.shopCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      };
    }
    const isPremium = product._isPremiumUser || false;
    const rawPrice = isPremium && product.prix_premium ? product.prix_premium : (product?.prix_standard || product?.prix || product?.price || 0);
    return {
      shopCart: [...state.shopCart, { ...product, name: product.nom || product.name || 'Produit sans nom', price: Number(rawPrice), quantity: 1 }]
    };
  }),
  removeFromCart: (productId) => set((state) => ({
    shopCart: state.shopCart.filter(item => item.id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    shopCart: state.shopCart.map(item => item.id === productId ? { ...item, quantity } : item)
  })),
  clearCart: () => set({ shopCart: [] })
}));
