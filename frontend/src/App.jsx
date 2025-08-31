// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";          // ⟵ add

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/c/:categorySlug" element={<CategoryPage />} />
          <Route path="/p/:slug" element={<ProductPage />} /> {/* ⟵ add */}
          <Route path="*" element={<div className="container py-5">Sidan hittades inte</div>} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
