---
name: Multi-Tenant Bookstore SaaS
overview: Next.js App Router + Apollo Server + TanStack Query + Supabase(RLS) ашиглан multi-tenant онлайн номын худалдааны SaaS платформ бүтээх. CallPro Mongolia Phone OTP нэвтрэлт болон QPay Mongolia төлбөрийн системийг интеграцлана.
todos:
  - id: project-setup
    content: Next.js project init + Supabase + Apollo Server + TanStack Query + Tailwind тохиргоо
    status: completed
  - id: database-schema
    content: "Supabase database migration: tenants, users, books, categories, orders, otp_codes + RLS"
    status: completed
  - id: graphql-layer
    content: Apollo Server setup + GraphQL schema + resolvers (books, orders, users, tenants)
    status: completed
  - id: callpro-auth
    content: "CallPro OTP auth: send-otp, verify-otp API routes + JWT token + login/verify UI"
    status: completed
  - id: storefront-ui
    content: "Storefront pages: book listing, detail, cart, search + TanStack Query hooks"
    status: completed
  - id: qpay-payment
    content: "QPay integration: invoice create, QR display, callback handler, order status update"
    status: completed
  - id: admin-dashboard
    content: "Admin panel: dashboard, book CRUD, order management"
    status: completed
  - id: tenant-routing
    content: Multi-tenant routing middleware + tenant resolution + theme support
    status: completed
---

# Multi-Tenant Онлайн Номын Худалдааны SaaS

## Архитектурын ерөнхий бүтэц

```mermaid
graph LR
    Client["Next.js Frontend\nTanStack Query"]
    API["Next.js API Route\n/api/graphql"]
    Apollo["Apollo Server\nGraphQL Resolvers"]
    Supabase["Supabase\nPostgreSQL + RLS"]
    CallPro["CallPro API\nPhone OTP"]
    QPay["QPay API\nPayment"]

    Client -->|"GraphQL Queries"| API
    API --> Apollo
    Apollo --> Supabase
    Apollo --> CallPro
    Apollo --> QPay
```

## Технологийн стек

| Layer | Technology |

|-------|-----------|

| Framework | Next.js 14 (App Router) |

| Frontend Data | TanStack Query + graphql-request |

| Backend API | Apollo Server (Next.js Route Handler) |

| Database | Supabase PostgreSQL |

| Multi-tenancy | Shared DB + tenant_id + RLS |

| Auth | CallPro OTP + Supabase Auth (custom JWT) |

| Payment | QPay Mongolia |

| Styling | Tailwind CSS |

## Төслийн бүтэц

```
src/
  app/
    (storefront)/
      [tenant]/            -- Tenant slug-аар dynamic route
        page.tsx            -- Нүүр хуудас
        books/
          page.tsx          -- Номын жагсаалт
          [id]/page.tsx     -- Номын дэлгэрэнгүй
        cart/page.tsx       -- Сагс
        checkout/page.tsx   -- Төлбөр төлөх
        orders/page.tsx     -- Захиалгын түүх
    (auth)/
      login/page.tsx        -- Утасны дугаараар нэвтрэх
      verify/page.tsx       -- OTP баталгаажуулах
    (admin)/
      [tenant]/
        dashboard/page.tsx  -- Admin dashboard
        books/page.tsx      -- Ном удирдах
        orders/page.tsx     -- Захиалга удирдах
    api/
      graphql/route.ts      -- Apollo Server endpoint
      auth/
        send-otp/route.ts   -- CallPro OTP илгээх
        verify-otp/route.ts -- OTP баталгаажуулах
      payments/
        qpay-callback/route.ts -- QPay callback
  lib/
    supabase/
      client.ts             -- Supabase client
      admin.ts              -- Supabase service role client
    graphql/
      schema.ts             -- GraphQL type definitions
      resolvers/
        book.ts
        order.ts
        user.ts
        tenant.ts
      context.ts            -- Apollo context (auth + tenant)
    callpro/
      client.ts             -- CallPro API client
    qpay/
      client.ts             -- QPay API client
    tanstack/
      providers.tsx         -- TanStack QueryClientProvider
      hooks/
        useBooks.ts
        useCart.ts
        useOrders.ts
  types/
    index.ts                -- TypeScript type definitions
```

## Database Schema (Supabase + RLS)

### Core Tables

**tenants** -- Дэлгүүр бүр нэг tenant

- `id` (uuid, PK), `name`, `slug` (unique), `logo_url`, `theme_config` (jsonb), `created_at`

**users** -- Хэрэглэгчид

- `id` (uuid, PK), `phone` (unique), `name`, `role` (enum: superadmin/admin/customer), `tenant_id` (FK), `created_at`

**books** -- Номын каталог

- `id` (uuid, PK), `tenant_id` (FK), `title`, `author`, `isbn`, `description`, `price` (numeric), `cover_image_url`, `stock` (int), `category_id` (FK), `is_active`, `created_at`

**categories** -- Ангилал

- `id` (uuid, PK), `tenant_id` (FK), `name`, `parent_id` (self FK)

**orders** -- Захиалга

- `id` (uuid, PK), `tenant_id` (FK), `user_id` (FK), `status` (enum: pending/paid/shipped/delivered/cancelled), `total_amount` (numeric), `qpay_invoice_id`, `payment_status`, `created_at`

**order_items** -- Захиалгын мөр

- `id` (uuid, PK), `order_id` (FK), `book_id` (FK), `quantity`, `unit_price`

**otp_codes** -- OTP баталгаажуулалт

- `id` (uuid, PK), `phone`, `code`, `expires_at`, `verified` (bool), `created_at`

### Row Level Security (RLS)

Бүх table-д `tenant_id`-аар RLS бодлого хэрэглэнэ:

- Хэрэглэгч зөвхөн өөрийн tenant-ийн датаг харна
- Admin зөвхөн өөрийн tenant-ийн датаг удирдана
- JWT дотор `tenant_id` + `user_id` + `role` хадгална

## Гол Flow-ууд

### 1. Phone OTP Нэвтрэх (CallPro)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant APIRoute as API Route
    participant CallProAPI as CallPro API
    participant DB as Supabase

    User->>Frontend: Утасны дугаар оруулах
    Frontend->>APIRoute: POST /api/auth/send-otp
    APIRoute->>DB: OTP код үүсгэж хадгалах
    APIRoute->>CallProAPI: SMS OTP илгээх
    CallProAPI-->>User: SMS OTP код
    User->>Frontend: OTP код оруулах
    Frontend->>APIRoute: POST /api/auth/verify-otp
    APIRoute->>DB: OTP шалгах + User upsert
    APIRoute-->>Frontend: JWT token + user info
```

### 2. Төлбөр төлөх (QPay)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant GraphQL as Apollo Server
    participant QPayAPI as QPay API
    participant DB as Supabase

    User->>Frontend: Checkout дарах
    Frontend->>GraphQL: createOrder mutation
    GraphQL->>DB: Order + OrderItems хадгалах
    GraphQL->>QPayAPI: POST /v2/auth/token
    QPayAPI-->>GraphQL: access_token
    GraphQL->>QPayAPI: POST /v2/invoice
    QPayAPI-->>GraphQL: QR code + urls
    GraphQL-->>Frontend: Order + QR code
    Frontend->>User: QR код харуулах
    QPayAPI->>GraphQL: POST /api/payments/qpay-callback
    GraphQL->>DB: Order status update to paid
```

## Хэрэгжүүлэх алхмууд

Дараах дарааллаар хэрэгжүүлнэ:

1. **Төслийн суурь**: Next.js + Supabase + Apollo Server + TanStack Query тохиргоо
2. **Database schema**: Supabase migration + RLS бодлогууд
3. **GraphQL schema + resolvers**: Type definitions, Book/Order/User/Tenant resolvers
4. **CallPro OTP auth**: Утасны дугаараар нэвтрэх бүрэн flow
5. **Storefront UI**: Номын жагсаалт, дэлгэрэнгүй, сагс, хайлт
6. **QPay payment**: Захиалга үүсгэх + QPay invoice + callback
7. **Admin dashboard**: Ном нэмэх/засах, захиалга удирдах
8. **Multi-tenant routing**: Tenant slug-аар routing + middleware