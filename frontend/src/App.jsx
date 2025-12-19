// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import DeliveryPage from "./pages/DeliveryPage";
import PaymentPage from "./pages/PaymentPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import ProductListPage from "./pages/admin/ProductListPage";
import ProductEditorPage from "./pages/admin/ProductEditorPage";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/c/:categorySlug" element={<CategoryPage />} />
            <Route path="/p/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/payment" element={<PaymentPage />} />


            <Route path="/login" element={<LoginPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/new" element={<ProductEditorPage />} />
              <Route path="products/edit/:id" element={<ProductEditorPage />} />
              {/* Placeholders for future pages */}
              <Route path="orders" element={<div className="p-4">Ordrar - Kommer snart</div>} />
              <Route path="users" element={<div className="p-4">Kunder - Kommer snart</div>} />
              <Route path="settings" element={<div className="p-4">Inställningar - Kommer snart</div>} />
            </Route>

            <Route path="*" element={<div className="container py-5">Sidan hittades inte</div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>

  );
}
