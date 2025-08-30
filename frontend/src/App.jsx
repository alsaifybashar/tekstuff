// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage"; // ← add this

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/c/:categorySlug" element={<CategoryPage />} />
          <Route path="/p/:productSlug" element={<ProductPage />} /> {/* ← new */}
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
