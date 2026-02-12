# 📚 Aylay Bookstore - Multi-Tenant System

Монгол номын дэлгүүрийн олон tenant-тэй систем (Next.js 14+ App Router, Supabase, QPay, CallPro SMS)

## 🚀 Одоогийн Байдал

✅ **АМЖИЛТТАЙ ТОХИРУУЛАГДСАН БА АЖИЛЛАЖ БАЙНА!**

- 🌐 Dev server: http://localhost:3000
- 🗄️ Supabase холбогдсон
- 💳 QPay payment бэлэн
- 📱 CallPro SMS интеграци хийгдсэн
- 👥 2 tenant үүссэн (admin1, admin2)
- 📖 5 ном нэмэгдсэн
- 🔐 Auth систем ажиллаж байна

## 📋 Үндсэн Боломжууд

### Хэрэглэгчийн Талаас (Customer)
- 📱 **OTP + PIN нэвтрэлт**: Утасны дугаараар OTP авах, 6 оронтой PIN үүсгэх
- 🛒 **Номын сагс**: Ном сонгох, тоо ширхэг өөрчлөх
- 🏪 **Tenant сонголт**: Checkout үед tenant (салбар) сонгох
- 💰 **QPay төлбөр**: QR код уншуулж төлөх
- 📦 **Хүргэлт мэдэгдэл**: SMS-ээр хүргэлтийн мэдээлэл авах

### Tenant Admin
- 🏢 **Subdomain нэвтрэлт**: merchant.{slug}.localhost:3000
- 📊 **Dashboard**: Борлуулалтын KPI, график
- 📋 **Захиалга удирдлага**: Зөвхөн өөрийн tenant-ийн захиалга
- ✅ **Хүргэлт toggle**: Delivered дарахад автомат SMS явна

### SuperAdmin
- 👑 **Бүх удирдлага**: Ном, захиалга, tenant, хэрэглэгч
- 📚 **Номын CRUD**: Ном нэмэх/засах/устгах
- 🏪 **Tenant удирдлага**: Шинэ tenant үүсгэх, credential тохируулах
- 📈 **Ерөнхий тайлан**: Бүх tenant-үүдийн нэгтгэсэн мэдээлэл

## 🔑 Нэвтрэх Мэдээлэл

### 1. SuperAdmin
```
URL: http://localhost:3000/admin/dashboard
Phone: 89897803
PIN: (аль хэдийн тохируулагдсан)
```

### 2. Tenant Admin - Салбар 1
```
URL: http://merchant.branch1.localhost:3000
Username: admin1
Password: password123
```

### 3. Tenant Admin - Салбар 2
```
URL: http://merchant.branch2.localhost:3000
Username: admin2
Password: password123
```

### 4. Хэрэглэгч (Customer)
```
URL: http://localhost:3000
Phone: ямар ч дугаар
→ OTP авна (CallPro SMS)
→ PIN үүсгэнэ (6 орон)
→ 30 хоног session хадгална
```

## 🛠️ Тохиргоо

### 1. Subdomain (Local Development)

`/etc/hosts` файлд нэмнэ:
```bash
127.0.0.1 merchant.branch1.localhost
127.0.0.1 merchant.branch2.localhost
```

macOS/Linux:
```bash
sudo nano /etc/hosts
```

### 2. Environment Variables

`.env.local` файл аль хэдийн бэлэн:
- ✅ Supabase: gwuoczfapluglshultqd
- ✅ QPay: Production API (aylay_mn_admin)
- ✅ CallPro: MessagePro API

## 📱 Системийг Турших

### А. Хэрэглэгчийн урсгал (Customer Flow)

1. **http://localhost:3000** рүү орно
2. **"Нэвтрэх"** дарна
3. Утасны дугаар оруулна (жнь: 99001122)
4. OTP код SMS-ээр ирнэ
5. OTP кодоо оруулна
6. 6 оронтой PIN үүсгэнэ (жнь: 123456)
7. Номуудыг үзэж, сагсанд хийнэ
8. **"Сагс" → "Төлбөр төлөх"** руу орно
9. **Tenant сонгоно** (Нэгдүгээр салбар / Хоёрдугаар салбар)
10. Хүргэлтийн мэдээлэл бөглөнө
11. Захиалга үүсгэнэ
12. QPay QR код гарна
13. QPay app-аар QR уншуулж төлнө
14. Амжилттай төлсөн бол SMS мэдэгдэл ирнэ

### Б. Tenant Admin урсгал

1. `/etc/hosts` тохируулах (дээр харна уу)
2. **http://merchant.branch1.localhost:3000** рүү орно
3. Login: **admin1** / **password123**
4. Dashboard үзнэ:
   - Өнөөдрийн борлуулалт
   - Захиалгын статистик
   - 7 хоногийн график
5. **"Захиалгууд"** цэсрүү орно
6. Өөрийн tenant-ийн захиалгууд харагдана
7. **"Delivered"** toggle дарна
8. Хэрэглэгч SMS-ээр "хүргэгдлээ" мэдэгдэл авна

### В. SuperAdmin урсгал

1. **http://localhost:3000/admin/dashboard** рүү орно
2. Phone: **89897803** + PIN оруулна
3. Цэснээс сонголт:
   - **Dashboard**: Ерөнхий KPI
   - **Books**: Номын жагсаалт, шинэ ном нэмэх
   - **Orders**: Бүх захиалгууд
   - **Tenants**: Салбарууд удирдах, шинэ үүсгэх
   - **Customers**: Хэрэглэгчдийн жагсаалт
4. **"Books" → "Add New Book"** дарж шинэ ном нэмэх
5. **"Tenants" → "Create Tenant"** дарж шинэ салбар үүсгэх

## 🗂️ Код бүтэц

```
src/
├── app/
│   ├── (auth)/              # Нэвтрэх хуудсууд
│   │   ├── login/
│   │   ├── verify-otp/
│   │   ├── create-pin/
│   │   └── verify-pin/
│   ├── (storefront)/        # Хэрэглэгчийн UI
│   │   ├── page.tsx         # Нүүр хуудас
│   │   ├── books/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── payment/
│   ├── admin/               # SuperAdmin
│   │   └── (superadmin)/
│   │       ├── dashboard/
│   │       ├── books/
│   │       ├── orders/
│   │       ├── tenants/
│   │       └── customers/
│   ├── merchant/            # Tenant Admin
│   │   └── (tenant-admin)/
│   │       ├── login/
│   │       ├── dashboard/
│   │       └── orders/
│   └── api/                 # API Routes
│       ├── auth/            # Authentication
│       ├── books/
│       ├── orders/
│       ├── payment/         # QPay
│       └── admin/
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── storefront/          # Хэрэглэгчийн components
│   ├── admin/               # Admin components
│   └── merchant/            # Tenant admin components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── auth/                # Auth utilities
│   ├── payment/             # QPay integration
│   ├── sms/                 # CallPro SMS
│   └── store/               # Zustand cart store
├── types/
│   ├── database.types.ts    # Supabase types
│   └── index.ts             # Custom types
└── middleware.ts            # Next.js middleware
```

## 🔐 Authentication Урсгал

### Customer (OTP + PIN)
```
1. Утасны дугаар оруулах
   ↓
2. Supabase-д шалгах (бүртгэлтэй эсэх)
   ↓
3а. PIN байвал → PIN оруулах
3б. PIN байхгүй бол → OTP илгээх
   ↓
4. OTP баталгаажуулах
   ↓
5. PIN үүсгэх (6 орон)
   ↓
6. JWT session үүсгэх (30 хоног)
   ↓
7. httpOnly cookie хадгалах
```

### Tenant Admin (Username + Password)
```
1. Subdomain шалгах (middleware)
   ↓
2. Username + Password оруулах
   ↓
3. bcrypt hash баталгаажуулах
   ↓
4. Tenant session үүсгэх (8 цаг)
   ↓
5. Cookie хадгалах
```

## 💳 QPay Payment Урсгал

```
1. Checkout дээр захиалга үүсгэх
   ↓
2. QPay API-руу invoice үүсгэх хүсэлт илгээх
3. Access token авах (cache - 10 мин)
4. Invoice үүсгэх
   ↓
5. QR code image URL буцаана
   ↓
6. Хэрэглэгч QR уншуулах
   ↓
7. QPay webhook дуудагдана
   ↓
8. Order status → PAID
   ↓
9. SMS мэдэгдэл (CallPro)
```

## 📱 SMS Мэдэгдэл

CallPro (MessagePro) API:
- **Захиалга баталгаажуулах**: "Таны ORD-XXXXX захиалга баталгаажлаа"
- **Хүргэгдсэн**: "Таны ORD-XXXXX захиалга амжилттай хүргэгдлээ"
- **OTP код**: "Таны OTP код: 123456. 5 минутын дотор хүчинтэй."

## 🗄️ Database Schema

### Tables
- `users` - Хэрэглэгчид (customer, admin, superadmin)
- `tenants` - Салбарууд/Мерчант
- `books` - Номын каталог
- `orders` - Захиалгууд
- `order_items` - Захиалгын дэлгэрэнгүй
- `admin_sessions` - Tenant admin session
- `otp_codes` - OTP баталгаажуулалт

### Key Relationships
```
users ←→ orders (customer)
tenants ←→ orders (merchant)
orders ←→ order_items ←→ books
tenants ←→ admin_sessions
```

## 🚨 Алдаа шийдвэрлэх (Troubleshooting)

### OTP ирэхгүй байвал?
- CallPro API key шалгах (.env.local)
- Terminal дээр log харах
- Утасны дугаарын формат шалгах (8 орон)

### QPay төлбөр ажиллахгүй байвал?
- Production credentials шалгах
- Network tab дээр API request харах
- Invoice code зөв эсэхийг шалгах: AYLAY_MN_INVOICE

### Subdomain ажиллахгүй байвал?
- `/etc/hosts` файл шалгах
- Browser restart хийх
- Format: merchant.{slug}.localhost:3000

### Database холбогдохгүй байвал?
- .env.local дээр Supabase credentials шалгах
- Supabase project active эсэхийг шалгах
- Network/firewall тохиргоо

## 📊 API Endpoints

### Authentication
- `POST /api/auth/check-user` - Хэрэглэгч шалгах
- `POST /api/auth/send-otp` - OTP илгээх
- `POST /api/auth/verify-otp` - OTP баталгаажуулах
- `POST /api/auth/create-pin` - PIN үүсгэх
- `POST /api/auth/verify-pin` - PIN-ээр нэвтрэх
- `POST /api/auth/tenant-login` - Tenant admin нэвтрэх
- `POST /api/auth/logout` - Гарах

### Books
- `GET /api/books` - Номын жагсаалт (pagination, search)
- `GET /api/books/[id]` - Номын дэлгэрэнгүй
- `POST /api/admin/books/create` - Ном нэмэх (admin only)

### Tenants
- `GET /api/tenants` - Active tenant-ууд
- `POST /api/admin/tenants/create` - Tenant үүсгэх

### Orders
- `POST /api/orders/create` - Захиалга үүсгэх
- `POST /api/orders/mark-delivered` - Хүргэгдсэн тэмдэглэх

### Payment
- `POST /api/payment/create-invoice` - QPay invoice
- `POST /api/payment/webhook` - QPay callback
- `POST /api/payment/check-status` - Төлбөрийн статус

## 🔄 Дараагийн алхам

- [ ] Book cover image upload (Supabase Storage)
- [ ] Tenant admin тайлан (Excel export)
- [ ] Customer захиалгын түүх
- [ ] Email мэдэгдэл (Resend)
- [ ] Inventory бага үлдэхэд alert
- [ ] Multi-language (MN/EN)
- [ ] Mobile app (React Native)

## 📞 Холбоо барих

Асуудал гарвал энэ README болон `SETUP.md` файлыг уншина уу.

**Амжилт хүсье! 🚀**
