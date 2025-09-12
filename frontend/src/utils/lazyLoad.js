// src/utils/lazyLoad.js
import { lazy, Suspense } from 'react';
import Spinner from 'react-bootstrap/Spinner';

/**
 * Loading component for lazy loaded routes
 */
export const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center min-vh-100">
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Laddar...</span>
    </Spinner>
  </div>
);

/**
 * Wrapper for lazy loading with error boundary
 */
export function lazyLoadComponent(importFunc, fallback = <PageLoader />) {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Update your App.jsx with lazy loaded routes:
// src/App.jsx - Updated version with lazy loading

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { lazyLoadComponent } from "./utils/lazyLoad";

// Lazy load all pages except HomePage (for better initial load)
import HomePage from "./pages/HomePage";

const CategoryPage = lazyLoadComponent(() => import("./pages/CategoryPage"));
const ProductPage = lazyLoadComponent(() => import("./pages/ProductPage"));
const CartPage = lazyLoadComponent(() => import("./pages/CartPage"));
const CheckoutPage = lazyLoadComponent(() => import("./pages/CheckoutPage"));
const LoginPage = lazyLoadComponent(() => import("./pages/LoginPage"));
const AccountPage = lazyLoadComponent(() => import("./pages/AccountPage"));
const SearchPage = lazyLoadComponent(() => import("./pages/SearchPage"));

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/c/:categorySlug" element={<CategoryPage />} />
          <Route path="/c/:categorySlug/:subSlug" element={<CategoryPage />} />
          <Route path="/p/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/search" element={<SearchPage />} />
          
          {/* Checkout flow */}
          <Route path="/checkout">
            <Route path="shipping" element={<CheckoutPage step="shipping" />} />
            <Route path="payment" element={<CheckoutPage step="payment" />} />
            <Route path="review" element={<CheckoutPage step="review" />} />
            <Route path="success/:orderId" element={<CheckoutPage step="success" />} />
          </Route>
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage mode="signup" />} />
          <Route path="/forgot-password" element={<LoginPage mode="forgot" />} />
          
          {/* Protected routes */}
          <Route path="/account/*" element={<AccountPage />} />
          
          {/* Legal */}
          <Route path="/legal/terms" element={<LegalPage type="terms" />} />
          <Route path="/legal/privacy" element={<LegalPage type="privacy" />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}