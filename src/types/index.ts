import { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type Book = Database['public']['Tables']['books']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type AdminSession = Database['public']['Tables']['admin_sessions']['Row']

export interface CartItem {
  book: Book
  // Digital books don't need quantity tracking - unlimited copies available
}

export interface CheckoutFormData {
  customer_name: string
  customer_phone: string
  tenant_id: string
  delivery_address: string
  delivery_note?: string
  delivery_date?: string
}

export interface QPayInvoiceResponse {
  invoice_id: string
  qr_text: string
  qr_image: string
  urls: Array<{
    name: string
    description: string
    logo: string
    link: string
  }>
}

export interface SMSRequest {
  to: string
  message: string
}

export type UserRole = 'superadmin' | 'tenant_admin' | 'customer'
