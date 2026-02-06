import gql from "graphql-tag";

export const typeDefs = gql`
  # ---------- Enums ----------

  enum UserRole {
    superadmin
    admin
    customer
  }

  enum OrderStatus {
    pending
    paid
    shipped
    delivered
    cancelled
  }

  enum PaymentStatus {
    unpaid
    paid
    refunded
  }

  # ---------- Types ----------

  type Tenant {
    id: ID!
    name: String!
    slug: String!
    logo_url: String
    theme_config: JSON
    created_at: String!
  }

  type User {
    id: ID!
    phone: String!
    name: String
    role: UserRole!
    tenant_id: ID
    created_at: String!
  }

  type Category {
    id: ID!
    tenant_id: ID!
    name: String!
    parent_id: ID
    children: [Category!]
  }

  type Book {
    id: ID!
    tenant_id: ID!
    title: String!
    author: String!
    isbn: String
    description: String
    price: Float!
    cover_image_url: String
    stock: Int!
    category_id: ID
    category: Category
    is_active: Boolean!
    created_at: String!
  }

  type Order {
    id: ID!
    tenant_id: ID!
    user_id: ID!
    user: User
    status: OrderStatus!
    total_amount: Float!
    qpay_invoice_id: String
    payment_status: PaymentStatus!
    items: [OrderItem!]!
    created_at: String!
  }

  type OrderItem {
    id: ID!
    order_id: ID!
    book_id: ID!
    book: Book
    quantity: Int!
    unit_price: Float!
  }

  type QPayInvoice {
    invoice_id: String!
    qr_text: String!
    qr_image: String!
    qpay_short_url: String!
    urls: [QPayBankUrl!]!
  }

  type QPayBankUrl {
    name: String!
    description: String!
    logo: String!
    link: String!
  }

  type PaymentCheckResult {
    paid: Boolean!
    order: Order
  }

  # ---------- Admin Types ----------

  type DashboardStats {
    totalBooks: Int!
    activeBooks: Int!
    totalOrders: Int!
    pendingOrders: Int!
    paidOrders: Int!
    totalRevenue: Float!
    recentOrders: [Order!]!
  }

  # ---------- Inputs ----------

  input CreateBookInput {
    title: String!
    author: String!
    isbn: String
    description: String
    price: Float!
    cover_image_url: String
    stock: Int!
    category_id: ID
    is_active: Boolean
  }

  input UpdateBookInput {
    title: String
    author: String
    isbn: String
    description: String
    price: Float
    cover_image_url: String
    stock: Int
    category_id: ID
    is_active: Boolean
  }

  input OrderItemInput {
    book_id: ID!
    quantity: Int!
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
  }

  # ---------- Queries ----------

  type Query {
    # Tenant
    tenant(slug: String!): Tenant
    tenants: [Tenant!]!

    # Books
    books(tenantId: ID!, limit: Int, offset: Int, search: String): [Book!]!
    book(id: ID!): Book

    # Admin Books (includes inactive)
    adminBooks(tenantId: ID!, limit: Int, offset: Int, search: String): [Book!]!

    # Categories
    categories(tenantId: ID!): [Category!]!

    # Orders
    orders: [Order!]!
    order(id: ID!): Order

    # Admin
    dashboardStats(tenantId: ID!): DashboardStats!

    # Users
    me: User
  }

  # ---------- Mutations ----------

  type Mutation {
    # Books (Admin)
    createBook(input: CreateBookInput!): Book!
    updateBook(id: ID!, input: UpdateBookInput!): Book!
    deleteBook(id: ID!): Boolean!

    # Orders
    createOrder(input: CreateOrderInput!): Order!
    cancelOrder(id: ID!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!

    # QPay Payment
    createQPayInvoice(orderId: ID!): QPayInvoice!
    checkOrderPayment(orderId: ID!): PaymentCheckResult!

    # Tenants (Superadmin)
    createTenant(name: String!, slug: String!): Tenant!

    # Tenant theme (Admin)
    updateTenantTheme(tenantId: ID!, theme: JSON!): Tenant!
  }

  # ---------- Scalars ----------

  scalar JSON
`;
