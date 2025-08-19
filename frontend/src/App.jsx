// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";

// TEMP mock loader (replace with real API call)
const fetchCategoryData = (slug) => {
  // return { products: [...], facets: {...} } for this slug
  return {
    products: [], // <- put your data here
    facets: { price: { min: 0, max: 10000 }, brands: [], attrs: {} },
  };
};

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/c/:categorySlug" element={<CategoryPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
