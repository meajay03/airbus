# Maison Véla — Ultra-Luxury Property Booking & Hospitality Operating System

An original luxury hospitality marketplace and operating platform built with **React**, **Vite**, **TypeScript**, **Express**, and **PostgreSQL**.

Maison Véla combines the discovery experience of Airbnb, the luxury villa positioning of StayVista and Lohono Stays, the curated property approach of SaffronStays, and the professional property-management partnership model of Spacez into a unified, production-oriented system.

---

## 1. Directory and File Architecture

The repository is organized following clean architectural boundaries, domain-driven subdirectories, strict TypeScript typing, and modular services.

```
AIRBUS/
├── index.html                   # HTML entry point with luxury fonts
├── package.json                 # Monorepo dependencies & scripts
├── tsconfig.json                # Frontend TypeScript configuration
├── vite.config.ts               # Vite bundler configuration & /api proxy
├── README.md                    # System documentation
│
├── src/                         # ==============================
│   │                            # FRONTEND APPLICATION (React + Vite + TS)
│   │                            # ==============================
│   ├── main.tsx                 # React DOM mount point
│   ├── App.tsx                  # Root state orchestration & view router
│   ├── styles.css               # Editorial CSS design tokens & mobile styles
│   │
│   ├── types/                   # Domain TypeScript interfaces
│   │   └── index.ts             # Property, Booking, Review, User, Concierge types
│   │
│   ├── services/                # Typed API client services
│   │   └── api.ts               # LuxuryApiClient (fetch, quote, book, cancel, AI)
│   │
│   ├── data/                    # Initial catalog & seed structures
│   │   └── properties.ts        # Luxury villa catalog across India & re-exports
│   │
│   ├── components/              # Modular UI Components (co-located .tsx & .css)
│   │   ├── Header.tsx           # Sticky luxury header, mobile drawer, role switcher
│   │   ├── Header.css           # Header & mobile drawer responsive plain CSS
│   │   ├── PropertyCard.tsx     # Villa card with rating, tags, compare, save
│   │   ├── PropertyCard.css     # Property card plain CSS
│   │   ├── ExploreView.tsx      # Advanced multi-filter discovery & geo-map view
│   │   ├── ExploreView.css      # Explore view & map plain CSS
│   │   ├── DetailView.tsx       # Property page, live quote calculator, amenities
│   │   ├── DetailView.css       # Property details & sticky calculator plain CSS
│   │   ├── CheckoutModal.tsx    # Multi-step checkout, Razorpay/UPI simulator
│   │   ├── CheckoutModal.css    # Checkout modal plain CSS
│   │   ├── GalleryModal.tsx     # Fullscreen high-resolution photo viewer
│   │   ├── GalleryModal.css     # Gallery modal plain CSS
│   │   ├── CompareModal.tsx     # Side-by-side comparison of up to 4 stays
│   │   ├── CompareModal.css     # Compare modal plain CSS
│   │   ├── AIConciergeModal.tsx # Natural-language travel concierge modal
│   │   ├── AIConciergeModal.css # AI Concierge modal plain CSS
│   │   ├── GuestDashboard.tsx   # Upcoming stays, refunds, wishlists, messaging
│   │   ├── GuestDashboard.css   # Guest portal plain CSS
│   │   ├── OwnerPortal.tsx      # Portfolio stats, 5-step villa onboarding wizard
│   │   ├── OwnerPortal.css      # Owner portal plain CSS
│   │   ├── AdminDashboard.tsx   # GBV metrics, verification queue, commissions
│   │   ├── AdminDashboard.css   # Admin portal & data tables plain CSS
│   │   ├── OperationsHub.tsx    # Housekeeping turnovers & maintenance tickets
│   │   ├── OperationsHub.css    # Operations hub plain CSS
│   │   └── index.ts             # Central component barrel export
│   │
│   ├── index.css                # Global design tokens, typography, CSS reset & badges
│   ├── App.css                  # App layout, hero, collections, editorial & footer CSS
│
└── server/                      # ==============================
    │                            # BACKEND API (Node.js + Express + TS)
    │                            # ==============================
    ├── tsconfig.json            # Server TypeScript configuration
    ├── test-inprocess.ts        # Root verification test runner
    ├── test-api.ts              # HTTP integration test runner
    │
    ├── src/                     # Server source code
    │   ├── index.ts             # Express app setup, CORS, security headers, health
    │   │
    │   ├── config/              # Centralized environment configuration
    │   │   └── index.ts         # Ports, database URL, default commission rates
    │   │
    │   ├── types/               # Backend domain types & interfaces
    │   │   └── index.ts         # User, Role, Property, Booking, Task models
    │   │
    │   ├── middleware/          # Express request middleware
    │   │   ├── auth.ts          # Session authentication & requireRole RBAC guard
    │   │   └── errorHandler.ts  # Centralized error response handler
    │   │
    │   ├── db/                  # Data persistence layer
    │   │   └── store.ts         # In-memory relational store & seed dataset
    │   │
    │   ├── services/            # Decoupled business logic services
    │   │   └── pricingService.ts# Nights calculation, GST (18%), service fees
    │   │
    │   └── routes/              # Modular Express REST controllers
    │       ├── index.ts         # Central API router mounting all modules
    │       ├── auth.ts          # /api/auth (me, login, register, role-switch)
    │       ├── properties.ts    # /api/properties (search, filter, create, status)
    │       ├── bookings.ts      # /api/bookings (quote, transactional create, cancel)
    │       ├── concierge.ts     # /api/concierge (services catalog, requests)
    │       ├── operations.ts    # /api/operations (cleaning checklists, maintenance)
    │       ├── admin.ts         # /api/admin (metrics, commissions, coupons, logs)
    │       └── ai.ts            # /api/ai/concierge (AI natural language travel engine)
    │
    ├── db/                      # Database migrations & SQL seeds
    │   ├── migrations/
    │   │   └── 001_initial_schema.sql # Production PostgreSQL migration DDL
    │   └── seeds/
    │       └── 001_demo.sql           # Demo seed policies
    │
    └── tests/                   # Automated verification test suites
        └── inprocess.test.ts    # In-process unit & integration verification
```

---

## 2. Route & URL Architecture

### Frontend Navigation Routes (HTML5 History API via `react-router-dom`)

| Route / URL | Component | Purpose |
| :--- | :--- | :--- |
| `/` | [`HomeView`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/HomeView.tsx) | Luxury editorial landing page, Hero, quick search bar, featured villas, curated themes, concierge showcase, and newsletter |
| `/explore` | [`ExploreView`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/ExploreView.tsx) | Full-catalog discovery with category pills, price range, bedroom count, amenities chips, interactive geo-map & grid switcher |
| `/properties/:slug` | [`PropertyDetailPage`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/PropertyDetailPage.tsx) | Direct shareable property dossier, high-res gallery lightbox, verified amenities, house rules, and live booking calculator |
| `/guest/dashboard` | [`GuestDashboard`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/GuestDashboard.tsx) | Guest privilege portal with active reservations, cancellation & refund status, saved wishlists, and host messages |
| `/owner/portal` | [`OwnerPortal`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/OwnerPortal.tsx) | Partner portal with occupancy metrics, 5-step listing onboarding wizard, and operations service requests |
| `/admin/dashboard` | [`AdminDashboard`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/AdminDashboard.tsx) | Executive control center with GBV financial reports, property verification queue, commission configuration, and audit logs |
| `/operations/hub` | [`OperationsHub`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/OperationsHub.tsx) | Hospitality operations hub with housekeeping turnover checklists and rapid engineering maintenance tickets |
| `*` | [`NotFoundPage`](file:///c:/Users/ajayk/OneDrive/Desktop/Create/AIRBUS/src/components/NotFoundPage.tsx) | Bespoke luxury 404 handler with return-to-home and collection navigation |

### Backend REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check & PostgreSQL live database connection verification |
| `GET` | `/api/properties` | Query published luxury properties with search, category, and pricing filters |
| `GET` | `/api/properties/:slugOrId` | Retrieve full property dossier, reviews, and similar sanctuaries |
| `POST` | `/api/properties` | Submit new luxury listing into PostgreSQL verification queue |
| `PATCH` | `/api/properties/:id/status` | Update property status (`approved`, `published`, `rejected`) |
| `GET` | `/api/bookings` | Retrieve confirmed bookings with breakdown & guest particulars |
| `POST` | `/api/bookings/quote` | Server-side pricing calculation with GST (18%), service fees & coupons |
| `POST` | `/api/bookings` | Atomic booking transaction with PostgreSQL double-booking prevention |
| `POST` | `/api/bookings/:id/cancel` | Cancel booking and initiate refund processing in PostgreSQL |
| `GET` | `/api/operations/cleaning` | Fetch housekeeping turnover tasks and checklists |
| `PATCH` | `/api/operations/cleaning/:id` | Update turnover inspection checklist items in PostgreSQL |
| `GET` | `/api/operations/maintenance` | Fetch maintenance dispatch tickets |
| `POST` | `/api/operations/maintenance` | Create and log maintenance ticket in PostgreSQL |
| `GET` | `/api/admin/metrics` | Executive Gross Booking Value, platform revenue & host payables |
| `GET` | `/api/admin/coupons` | Fetch active promotional coupon codes |
| `POST` | `/api/admin/coupons` | Provision new coupon into PostgreSQL `coupons` table |
| `GET` | `/api/admin/audit-logs` | Retrieve immutable audit log records from PostgreSQL |
| `POST` | `/api/ai/concierge` | Query conversational AI travel concierge for bespoke itineraries |

---

## 3. Technology Stack

- **Frontend:** React 18, Vite 6, TypeScript, plain CSS design token architecture (DM Sans & Playfair Display, warm ivory `#f8f7f3`, deep charcoal `#292822`, gold `#aa8a5c`). Zero Tailwind dependency.
- **Backend:** Node.js, Express 4, TypeScript, RESTful modular architecture.
- **Database:** PostgreSQL with parameterized SQL, relational schema, indexes, constraints, and migrations (`server/db/migrations/001_initial_schema.sql`).
- **Data Engine:** Dual-mode architecture supporting live PostgreSQL connections via `pg.Pool` with an in-memory/JSON fallback store for zero-config local testing.
- **Security:** Role-based access control (`guest`, `owner`, `manager`, `staff`, `admin`), payment idempotency, double-booking prevention via date overlap constraints, and server-side price verification.

---

## 3. Getting Started

### Install Dependencies
```sh
npm install
```

### Run the Frontend
```sh
npm run dev
```
The frontend is available at `http://localhost:5173`.

### Run the API Server
```sh
npm run server:dev
```
The API is available at `http://localhost:4000`.

### Build Both
```sh
npm run build         # Builds frontend with TypeScript & Vite
npm run server:build  # Builds backend with TypeScript
```

### Run In-Process Verification Tests
```sh
npx tsx server/test-inprocess.ts
```

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & database connection status |
| `GET` | `/api/auth/me` | Current user profile |
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/switch-role` | Demo persona switcher (`guest`, `owner`, `manager`, `admin`) |
| `GET` | `/api/properties` | Search, filter (amenity, price, category), and sort properties |
| `GET` | `/api/properties/:slug` | Full property details, reviews, and similar stays |
| `POST` | `/api/properties` | Submit new property for onboarding |
| `PATCH` | `/api/properties/:id/status` | Approve, reject, or publish property |
| `POST` | `/api/bookings/quote` | Server price calculation with tax, fees, and coupons |
| `POST` | `/api/bookings` | Transactional reservation creation with double-booking prevention |
| `GET` | `/api/bookings` | List bookings (filtered by role or user) |
| `POST` | `/api/bookings/:id/cancel` | Cancel reservation & calculate refund |
| `GET` | `/api/concierge/services` | List curated concierge offerings |
| `POST` | `/api/concierge/requests` | Book in-villa chef, yacht charter, or chauffeur |
| `GET` | `/api/operations/cleaning` | Housekeeping turnover tasks & checklists |
| `PATCH` | `/api/operations/cleaning/:id`| Update checklist item or task status |
| `GET` | `/api/operations/maintenance` | Maintenance tickets |
| `POST` | `/api/operations/maintenance` | Dispatch new maintenance ticket |
| `GET` | `/api/admin/metrics` | Executive financial and occupancy metrics |
| `PUT` | `/api/admin/commissions` | Update platform commission settings |
| `GET` | `/api/admin/coupons` | List promo codes |
| `POST` | `/api/admin/coupons` | Create promo code |
| `GET` | `/api/admin/audit-logs` | Retrieve system audit logs |
| `POST` | `/api/ai/concierge` | AI Travel Concierge natural-language query |
