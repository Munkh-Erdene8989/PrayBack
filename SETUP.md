# Setup Instructions

## ✅ Completed Setup

1. **Environment Variables** - All credentials configured in `.env.local`
2. **Database Migrations** - All tables created successfully
3. **Sample Data** - Tenants and books added

## Current Status

- ✅ Next.js dev server running at http://localhost:3000
- ✅ Supabase connected (Project: gwuoczfapluglshultqd)
- ✅ QPay configured (Production API)
- ✅ CallPro SMS configured (MessagePro)

## Database Tables

- `users` - Customer and admin users (2 users exist)
- `tenants` - Merchants/suppliers (2 tenants: admin1, admin2)
- `books` - Product catalog (5 books added)
- `orders` - Customer orders
- `order_items` - Order line items
- `admin_sessions` - Tenant admin sessions
- `otp_codes` - OTP verification codes

## Login Credentials

### Tenant Admin Login
Access via: http://merchant.branch1.localhost:3000 or http://merchant.branch2.localhost:3000

**Branch 1:**
- Username: `admin1`
- Password: `password123`

**Branch 2:**
- Username: `admin2`
- Password: `password123`

### SuperAdmin Login
- Phone: `89897803` (with PIN already set)
- Access at: http://localhost:3000/admin/dashboard

### Customer Login
- Any phone number (will get OTP via CallPro SMS)
- Create 6-digit PIN on first login

## Testing the Application

### 1. Test Customer Flow:
```
1. Go to http://localhost:3000
2. Click "Нэвтрэх" (Login)
3. Enter phone number
4. Receive OTP via SMS
5. Verify OTP
6. Create 6-digit PIN
7. Browse books and add to cart
8. Go to checkout
9. Select a tenant (Нэгдүгээр салбар or Хоёрдугаар салбар)
10. Fill delivery info
11. Create order
12. Pay with QPay QR code
```

### 2. Test Tenant Admin:
```
1. Add to /etc/hosts: 127.0.0.1 merchant.branch1.localhost
2. Go to http://merchant.branch1.localhost:3000
3. Login with admin1 / password123
4. View dashboard with KPIs
5. See orders for your tenant
6. Mark orders as delivered (sends SMS)
```

### 3. Test SuperAdmin:
```
1. Go to http://localhost:3000/admin/dashboard
2. Login with phone 89897803
3. View all orders, books, tenants, customers
4. Manage books, tenants, etc.
```

## Subdomain Setup (for Tenant Admin)

### For Local Development:

Edit `/etc/hosts`:
```
127.0.0.1 merchant.branch1.localhost
127.0.0.1 merchant.branch2.localhost
```

Then access:
- Branch 1: http://merchant.branch1.localhost:3000
- Branch 2: http://merchant.branch2.localhost:3000

### For Production:

1. Add DNS wildcard record: `*.yourdomain.com` → your server IP
2. Configure Next.js to handle subdomains
3. Deploy to Vercel/your hosting

## API Endpoints

### Authentication
- `POST /api/auth/check-user` - Check if user exists
- `POST /api/auth/send-otp` - Send OTP via CallPro
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/create-pin` - Create 6-digit PIN
- `POST /api/auth/verify-pin` - Login with PIN
- `POST /api/auth/tenant-login` - Tenant admin login
- `POST /api/auth/logout` - Logout

### Books
- `GET /api/books` - List books (with pagination, search, filters)
- `GET /api/books/[id]` - Get book details

### Tenants
- `GET /api/tenants` - List active tenants

### Orders
- `POST /api/orders/create` - Create order
- `POST /api/orders/mark-delivered` - Mark as delivered (sends SMS)

### Payment
- `POST /api/payment/create-invoice` - Create QPay invoice
- `POST /api/payment/webhook` - QPay webhook handler
- `POST /api/payment/check-status` - Check payment status

## Troubleshooting

### OTP not received?
- Check CallPro SMS API key in `.env.local`
- Check phone number format
- View logs in terminal

### QPay payment not working?
- Verify QPay credentials (production URL is used)
- Check invoice code: AYLAY_MN_INVOICE
- Test with QPay app

### Subdomain not working?
- Check `/etc/hosts` configuration
- Make sure format is: `merchant.{slug}.localhost`
- Restart browser after hosts file change

## Next Features to Add

1. SuperAdmin book CRUD forms (new/edit pages)
2. Tenant admin reports with charts
3. Image upload for book covers (Supabase Storage)
4. Order status workflow (Processing state)
5. Customer order history page
6. Email notifications
7. Inventory alerts
8. Multi-language support
