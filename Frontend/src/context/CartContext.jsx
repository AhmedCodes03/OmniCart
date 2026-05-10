import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || role !== 'customer') {
      setCart([]);
      setCartTotal(0);
      setCartCount(0);
      return;
    }
    
    try {
      setLoading(true);
      const res = await API.get('/cart');
      setCart(res.data.cart || []);
      setCartTotal(res.data.total || 0);
      setCartCount(res.data.item_count || 0);
    } catch (err) {
      // Cart might not be available or 404 if empty, which is fine
      setCart([]);
      setCartTotal(0);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Update quantity (absolute) - used in Cart page +/-
  const updateQuantity = async (productId, quantity) => {
    try {
      await API.post('/cart', { product_id: productId, quantity });
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  // Add to cart (incremental) - used in Product Detail/Card
  const addToCart = async (productId, quantity = 1) => {
    try {
      // Find current quantity to increment
      const existingItem = cart.find(item => item.product_id === productId);
      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      await API.post('/cart', { product_id: productId, quantity: newQuantity });
      await fetchCart();
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await API.delete(`/cart/${cartItemId}`);
      await fetchCart();
      toast.success('Removed from cart');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await API.delete('/cart');
      setCart([]);
      setCartTotal(0);
      setCartCount(0);
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  };

  const value = useMemo(() => ({
    cart, cartTotal, cartCount, loading, 
    addToCart, updateQuantity, removeFromCart, clearCart, fetchCart 
  }), [cart, cartTotal, cartCount, loading, fetchCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
