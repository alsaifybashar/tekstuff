## Project desciption

In this project we are building a webshop that is based on react frontend. The frontend uses `React Bootstrap` components to faster create components. 




## Dependencis
`npm install react-bootstrap bootstrap`
`pnpm add react-bootstrap bootstrap`
`pnpm add react-router-dom`
`npm install react-icons`




# todo

## Core Customer-Facing
Most of the goals under this section is done! Missing the search function whcih will later be added together with the REST API
- **Home** — `/`
- **Search results** — `/search?q=…`
- **Category listing** — `/c/:categorySlug`
- **Subcategory** — `/c/:categorySlug/:subSlug`
- **Brand listing** — `/brands` and `/brand/:brandSlug`
- **Product detail (PDP)** — `/p/:productSlug`  
  _(gallery, specs, stock, reviews, related)_
- **Collections / Landing pages** — `/collections/:slug`  
  _(e.g., “Super Deals”, “Back to school”)_

## Conversion Funnel

- **Cart** — `/cart`
- **Checkout**
  - Shipping — `/checkout/shipping`
  - Payment — `/checkout/payment`
  - Review / Place order — `/checkout/review`
  - Success / Receipt — `/checkout/success/:orderId`
- _Guest checkout supported on all checkout routes_

## Authentication & Account Access

- **Login** — `/login`
- **Signup / Create account** — `/signup`
- **Logout** — `/logout` _(action-only)_
- **Forgot password** — `/forgot-password`
- **Reset password** — `/reset-password/:token`
- **Email verification** — `/verify-email/:token`
- **2FA setup/verify (optional)** — `/account/security/2fa`

## Customer “My Account” Area

- **Dashboard** — `/account`
- **Profile** — `/account/profile`
- **Addresses** — `/account/addresses`
- **Payment methods** — `/account/payments`
- **Orders** — `/account/orders`
  - Order detail — `/account/orders/:orderId`
- **Returns (RMA)** — `/account/returns` and `/account/returns/:rmaId`
- **Wishlist** — `/account/wishlist`
- **Notifications & subscriptions** — `/account/notifications`
- **Saved carts / Recently viewed (optional)** — `/account/saved`
- **Support tickets (optional)** — `/account/support`
- **Loyalty / Points (optional)** — `/account/loyalty`
- **Gift cards (optional)** — `/account/gift-cards`

## Reviews & Community (Optional but Common)

- **Write a review** — `/p/:productSlug/review`
- **Q&A** — `/p/:productSlug/questions`

## Content & Info

- **About us** — `/about`
- **Contact** — `/contact`
- **Stores / Pickup locations** — `/stores`
- **Shipping & delivery info** — `/info/shipping`
- **Returns & warranty** — `/info/returns`
- **Payment & financing** — `/info/payment`
- **FAQ** — `/faq`
- **Blog / Guides / News** — `/blog` and `/blog/:slug`
- **Careers** — `/careers`

## Legal & Compliance

- **Terms & conditions** — `/legal/terms`
- **Privacy policy** — `/legal/privacy`
- **Cookies policy / settings** — `/legal/cookies` and `/cookies`
- **Accessibility statement** — `/legal/accessibility`
- **Imprint / Company info** — `/legal/imprint`

## Marketing & SEO Helpers

- **Deals / Super Deals** — `/deals`
- **New arrivals** — `/new`
- **Best sellers / Popular** — `/popular`
- **Compare** — `/compare`  
  _(with query or state: `/compare?ids=…`)_
- **Referral / Affiliate landers** — `/r/:code`
- **Campaign landers** — `/lp/:slug`
- **Sitemaps** — `/sitemap.xml`, `/robots.txt`, `/.well-known/*`

## System / Utility Pages

- **Email unsubscribe** — `/unsubscribe/:token`
- **Status messages (optional)** — `/status/:code`
- **404 Not Found** — `*` _(catch-all)_
- **500 Error** — `/error`

## Admin / Back Office (if hosted in same app)

- **Dashboard** — `/admin`
- **Products (CRUD)** — `/admin/products`
- **Categories** — `/admin/categories`
- **Orders** — `/admin/orders`
- **Customers** — `/admin/customers`
- **Discounts / Coupons** — `/admin/discounts`
- **Content (CMS, blog)** — `/admin/content`
- **Banners / Carousels** — `/admin/marketing`
- **Inventory / Stock** — `/admin/inventory`
- **Settings** — `/admin/settings`

## B2B (Optional)

- **Business signup** — `/business/signup`
- **Quotes** — `/account/quotes`
- **Company accounts & users** — `/account/company`
- **Tax-exempt / VAT validation** — `/account/tax`
