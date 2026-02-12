# Supabase Database Schema

This directory contains SQL migrations for the multi-tenant bookstore database.

## Running Migrations

### Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Using Supabase Dashboard (SQL Editor)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (001, 002, 003, etc.)

## Migration Files

1. `001_create_profiles_table.sql` - User profiles with PIN authentication
2. `002_create_tenants_table.sql` - Tenant/merchant management
3. `003_create_books_table.sql` - Book catalog
4. `004_create_orders_table.sql` - Order management
5. `005_create_order_items_table.sql` - Order line items
6. `006_create_admin_sessions_table.sql` - Tenant admin sessions
7. `007_create_functions.sql` - Database functions and triggers

## Database Schema

### Tables

- **profiles** - User authentication and profile data
- **tenants** - Tenant/merchant information
- **books** - Product catalog
- **orders** - Customer orders
- **order_items** - Order line items
- **admin_sessions** - Tenant admin session tracking

### Functions

- `generate_order_number()` - Generate unique order numbers
- `update_book_stock()` - Auto-update book stock on orders
- `calculate_order_total()` - Calculate order totals
- `get_tenant_by_slug()` - Retrieve tenant by slug

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can only access their own data
- Tenant admins can only access their tenant's data
- Service role (backend API) has full access
- Public can view active books and tenants

## Initial Setup

After running migrations, you'll need to:

1. Create a superadmin user in Supabase Auth
2. Add the superadmin user to the profiles table
3. Create initial tenant records for testing
4. Add sample books to the catalog

## Environment Variables

Make sure to set these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
