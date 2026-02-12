export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          name: string | null
          role: 'superadmin' | 'admin' | 'customer'
          tenant_id: string | null
          pin_hash: string | null
          pin_set_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          name?: string | null
          role?: 'superadmin' | 'admin' | 'customer'
          tenant_id?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          name?: string | null
          role?: 'superadmin' | 'admin' | 'customer'
          tenant_id?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          phone: string
          pin_hash: string | null
          has_pin: boolean
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone: string
          pin_hash?: string | null
          has_pin?: boolean
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          pin_hash?: string | null
          has_pin?: boolean
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          admin_username: string
          admin_password_hash: string
          contact_phone: string | null
          contact_email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          admin_username: string
          admin_password_hash: string
          contact_phone?: string | null
          contact_email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          admin_username?: string
          admin_password_hash?: string
          contact_phone?: string | null
          contact_email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          isbn: string | null
          description: string | null
          price: number
          stock_quantity: number
          cover_image_url: string | null
          category: string | null
          published_year: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author?: string | null
          isbn?: string | null
          description?: string | null
          price: number
          stock_quantity?: number
          cover_image_url?: string | null
          category?: string | null
          published_year?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string | null
          isbn?: string | null
          description?: string | null
          price?: number
          stock_quantity?: number
          cover_image_url?: string | null
          category?: string | null
          published_year?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          tenant_id: string
          customer_phone: string
          customer_name: string | null
          delivery_address: string
          delivery_note: string | null
          delivery_date: string | null
          subtotal: number
          discount: number
          delivery_fee: number
          total_amount: number
          payment_status: string
          payment_id: string | null
          qpay_invoice_id: string | null
          delivery_status: string
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          tenant_id: string
          customer_phone: string
          customer_name?: string | null
          delivery_address: string
          delivery_note?: string | null
          delivery_date?: string | null
          subtotal: number
          discount?: number
          delivery_fee?: number
          total_amount: number
          payment_status?: string
          payment_id?: string | null
          qpay_invoice_id?: string | null
          delivery_status?: string
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          tenant_id?: string
          customer_phone?: string
          customer_name?: string | null
          delivery_address?: string
          delivery_note?: string | null
          delivery_date?: string | null
          subtotal?: number
          discount?: number
          delivery_fee?: number
          total_amount?: number
          payment_status?: string
          payment_id?: string | null
          qpay_invoice_id?: string | null
          delivery_status?: string
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          book_id: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          book_id: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          book_id?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
          created_at?: string
        }
      }
      admin_sessions: {
        Row: {
          id: string
          tenant_id: string
          username: string
          session_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          username: string
          session_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          username?: string
          session_token?: string
          expires_at?: string
          created_at?: string
        }
      }
    }
  }
}
