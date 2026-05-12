import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';

// Customer
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerOrders from './pages/customer/Orders';
import OrderDetail from './pages/customer/OrderDetail';

// Vendor
import VendorDashboard from './pages/vendor/Dashboard';
import MyProducts from './pages/vendor/MyProducts';
import AddProduct from './pages/vendor/AddProduct';
import EditProduct from './pages/vendor/EditProduct';
import VendorOrders from './pages/vendor/VendorOrders';

// Admin
import AdminDashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'glass-strong !rounded-[24px] !border-surface-200 dark:!border-white/10 !text-surface-950 dark:!text-black !font-black !text-[11px] !uppercase !tracking-widest !shadow-2xl',
                style: {
                  backdropFilter: 'blur(30px)',
                  padding: '16px 24px',
                },
                success: {
                  iconTheme: { primary: '#6366f1', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#f43f5e', secondary: '#fff' },
                },
              }}
            />
            <Routes>
              <Route element={<Layout />}>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />

                {/* Customer */}
                <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute allowedRoles={['customer']}><Checkout /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrders /></ProtectedRoute>} />
                <Route path="/dashboard/orders/:id" element={<ProtectedRoute allowedRoles={['customer']}><OrderDetail /></ProtectedRoute>} />

                {/* Vendor */}
                <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
                <Route path="/vendor/products" element={<ProtectedRoute allowedRoles={['vendor']}><MyProducts /></ProtectedRoute>} />
                <Route path="/vendor/products/add" element={<ProtectedRoute allowedRoles={['vendor']}><AddProduct /></ProtectedRoute>} />
                <Route path="/vendor/products/edit/:id" element={<ProtectedRoute allowedRoles={['vendor']}><EditProduct /></ProtectedRoute>} />
                <Route path="/vendor/orders" element={<ProtectedRoute allowedRoles={['vendor']}><VendorOrders /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

                {/* Profile (any authenticated user) */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
