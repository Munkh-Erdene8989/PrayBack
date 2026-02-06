// ==========================================
// Multi-Tenant Bookstore SaaS — Type Definitions
// ==========================================

// ---------- Enums ----------

export type UserRole = "superadmin" | "admin" | "customer";

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

// ---------- Database Row Types ----------

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_config: Record<string, unknown> | null;
  created_at: string;
}

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  tenant_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  parent_id: string | null;
}

export interface Book {
  id: string;
  tenant_id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  price: number;
  cover_image_url: string | null;
  stock: number;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  qpay_invoice_id: string | null;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  quantity: number;
  unit_price: number;
}

export interface OtpCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
}

// ---------- GraphQL Context ----------

export interface GraphQLContext {
  user: User | null;
  tenantId: string | null;
}

// ---------- Cart (client-side) ----------

export interface CartItem {
  book: Book;
  quantity: number;
}
