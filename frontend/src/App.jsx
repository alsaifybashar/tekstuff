// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";


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

            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<div className="container py-5">Sidan hittades inte</div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>

  );
}
