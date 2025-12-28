# TekStuff E-Commerce Project

A full-stack e-commerce application built with a React frontend and a Node.js/Express backend. This project features a modern shopping experience with product browsing, cart management, checkout processes (including Stripe integration), and user authentication.

## 🚀 Technology Stack

### Frontend
*   **Framework:** [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
*   **Styling:** [Bootstrap 5](https://getbootstrap.com/) & [React Bootstrap](https://react-bootstrap.netlify.app/)
*   **State Management/Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
*   **Routing:** [React Router](https://reactrouter.com/)
*   **Icons:** [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)

### Backend
*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/)
*   **Database:** PostgreSQL (with `pg` driver)
*   **Authentication:** JWT (JSON Web Tokens) & Sessions
*   **Payments:** [Stripe](https://stripe.com/)
*   **Validation:** Joi & Express Validator
*   **Email:** Nodemailer

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [PostgreSQL](https://www.postgresql.org/)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tekstuff
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure the environment.

```bash
cd backend
npm install
```

**Configuration:**
Create a `.env` file in the `backend` directory based on the example:
```bash
cp .env.example .env
```
Open `.env` and configure your database credentials, Stripe keys, and JWT secrets. Ensure your PostgreSQL database is running and accessible via the `DATABASE_URL`.

**Run the Backend:**
```bash
# Development mode (restarts on changes)
npm run dev

# Production mode
npm start
```
The server typically runs on `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies.

```bash
cd frontend
npm install
```

**Run the Frontend:**
```bash
npm run dev
```
The frontend will typically run on `http://localhost:5173` (or the port shown in your terminal).

## 📂 Project Structure

```
tekstuff/
├── backend/                # Node.js/Express Server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route logic
│   ├── middleware/         # Express middleware (auth, logging)
│   ├── routes/             # API routes
│   └── server.js           # Entry point
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── pages/          # Application pages (Home, Product, Cart)
│   │   ├── components/     # Reusable UI components
│   │   └── ...
│   └── vite.config.js      # Vite configuration
│
└── README.md               # This file
```

## ✨ Key Features (Implemented & Planned)

*   **Product Catalog:** Browse products, categories, brands, and search functionality.
*   **User Accounts:** Sign up, login, profile management, and order history.
*   **Shopping Cart:** Add/remove items, update quantities.
*   **Checkout:** Secure checkout process with shipping and payment integration (Stripe).
*   **Admin Dashboard:** (Planned) Manage products, orders, and users.
*   **Responsive Design:** Optimized for mobile and desktop devices.
