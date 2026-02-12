# QPay Төлбөрийн Систем - Debugging Guide

## Одоогийн Асуудал

1. ✅ Order амжилттай үүсч байна (Supabase)
2. ❌ QPay Invoice үүсгэхэд "Bad Request" алдаа гарч байна
3. ❌ Төлбөр төлөх боломжгүй
4. ❌ Төлбөр амжилттай статус хандахгүй байна

## Шалгах Алхмууд

### 1. QPay Credentials шалгах

Browser дээр энэ URL-ийг нээж, credentials зөв эсэхийг шалгана:
```
http://localhost:3002/api/payment/test-qpay
```

Хариу:
- ✅ `success: true` - Credentials зөв байна
- ❌ `success: false` - Credentials буруу байна

### 2. Environment Variables шалгах

`.env.local` файлыг шалгаарай:

```bash
# Production credentials
QPAY_CLIENT_ID=AYLAY_MN
QPAY_CLIENT_SECRET=QLCVRVXj
QPAY_INVOICE_CODE=AYLAY_MN_INVOICE
QPAY_RECEIVER_CODE=terminal
QPAY_API_URL=https://merchant.qpay.mn/v2
NEXT_PUBLIC_APP_URL=https://pray-back.vercel.app
```

⚠️ **Анхааруулга**: 
- `QPAY_API_URL` Production хувьд `https://merchant.qpay.mn/v2` байх ёстой
- `QPAY_API_URL` Test/Sandbox хувьд `https://merchant-sandbox.qpay.mn/v2` байх ёстой
- `NEXT_PUBLIC_APP_URL` таны Production URL байх ёстой

### 3. QPay-тай холбогдох

Хэрэв credentials-д асуудал байвал:

📧 **Email**: info@qpay.mn
📞 **Утас**: [QPay support утас]

Асуух зүйлс:
1. Invoice Code зөв үү? (`AYLAY_MN_INVOICE`)
2. Client ID зөв үү? (`AYLAY_MN`)
3. Client Secret идэвхтэй үү?
4. Production API эсвэл Sandbox API ашиглах вэ?
5. Callback URL whitelist-д нэмэгдсэн үү?

### 4. Invoice Creation Parameters

QPay Invoice үүсгэхэд дараах parameters шаардлагатай:

```json
{
  "invoice_code": "AYLAY_MN_INVOICE",
  "sender_invoice_no": "ORD-20260213-12345",
  "invoice_receiver_code": "terminal",
  "invoice_description": "Номын захиалга #ORD-20260213-12345",
  "amount": 50000,
  "callback_url": "https://pray-back.vercel.app/api/payment/webhook"
}
```

**Шалгах зүйлс**:
- `invoice_code` - QPay-аас олгосон код
- `sender_invoice_no` - Таны системийн захиалгын дугаар (unique)
- `amount` - Бүхэл тоо байх ёстой (₮50,000 = 50000)
- `callback_url` - HTTPS протокол ашиглах ёстой, localhost ажиллахгүй

### 5. Төлбөр Амжилттай Статус Шалгах

QPay-ын төлбөр амжилттай төлөгдөхөд 2 арга байна:

#### A. Webhook (Автомат) - Production дээр ажиллана
```
POST https://your-domain.com/api/payment/webhook
```

Webhook payload:
```json
{
  "object_id": "invoice_id",
  "object_type": "INVOICE",
  "payment_status": "PAID",
  "payment_id": "payment_12345"
}
```

⚠️ **Анхааруулга**: 
- Localhost дээр webhook ажиллахгүй (QPay интернетээс таны серверт хандах ёстой)
- Production/Vercel дээр deploy хийсний дараа ажиллана

#### B. Polling (Шалгах) - Development болон Production дээр ажиллана

Систем 10 секунд тутамд QPay API-руу хандаж төлбөрийн статусыг шалгана:

```javascript
// Check Payment Status API
POST /v2/payment/check
{
  "object_type": "INVOICE",
  "object_id": "invoice_id"
}

// Response
{
  "count": 1,
  "rows": [
    {
      "payment_id": "12345",
      "payment_status": "PAID",
      "payment_amount": 50000
    }
  ]
}
```

### 6. Development Mode дээр төлбөр баталгаажуулах

Localhost дээр webhook ажиллахгүй тул:

1. **Manual Complete товч** - Development mode дээр QR code-ын доор харагдана
2. Төлбөр QPay app-аар төлсний дараа "✅ Төлбөр Төлсөн" товчийг дарна
3. Энэ нь manual байдлаар төлбөрийг PAID болгож, SMS илгээнэ

### 7. Terminal Logs Шалгах

Development server ажиллаж байх үед terminal дээр logs харна:

```bash
npm run dev
```

Шалгах logs:
- `[DEBUG] Creating QPay invoice with:` - Invoice үүсгэж байна
- `✅ QPay auth SUCCESS` - Authentication амжилттай
- `❌ QPay invoice creation failed:` - Invoice үүсгэхэд алдаа гарсан
- `🔔 [WEBHOOK] QPay webhook received` - Webhook ирсэн
- `✅ Payment confirmed from QPay!` - Төлбөр баталгаажсан

### 8. Supabase Orders Table Шалгах

Supabase Dashboard → Table Editor → orders

Шалгах columns:
- `order_number` - Захиалгын дугаар үүссэн үү?
- `qpay_invoice_id` - Invoice ID хадгалагдсан уу?
- `payment_status` - 'PENDING' эсвэл 'PAID'
- `payment_id` - QPay payment ID

### 9. Success Page харагдахгүй байх шалтгаан

Success page харагдахгүй байгаа шалтгаанууд:
1. ❌ Invoice үүсгэгдээгүй - QR code гарахгүй → төлбөр төлөх боломжгүй
2. ❌ Webhook ирэхгүй байна - Production дээр deploy хийх шаардлагатай
3. ❌ Polling ажиллахгүй байна - QPay API credentials буруу

Шийдэл:
- Production дээр deploy хийх (webhook ажиллана)
- Development дээр Manual Complete товчийг ашиглах
- QPay credentials шалгах

## Одоогийн Статус Шалгах

1. Test QPay credentials:
   ```
   GET http://localhost:3002/api/payment/test-qpay
   ```

2. Order үүсгэж үзэх
3. Terminal logs-оос алдаа шалгах
4. QPay-тай холбогдож credentials баталгаажуулах (хэрэв auth алдаа байвал)

## Төлбөрийн Flow

```
1. Хэрэглэгч захиалга үүсгэнэ
   → POST /api/orders/create
   → Order Supabase-д хадгалагдана (payment_status: PENDING)

2. Төлбөрийн хуудас руу redirect хийгдэнэ
   → GET /payment/[orderId]
   → POST /api/payment/create-invoice (QPay Invoice үүсгэнэ)
   → QR Code харуулна

3. Хэрэглэгч QPay-аар төлбөр төлнө
   → QPay app дээр QR code scan хийнэ
   → Төлбөр төлнө

4. Төлбөр баталгаажна (2 арга)
   
   A. Webhook (Production):
   → QPay → POST /api/payment/webhook
   → Order payment_status = 'PAID'
   → SMS илгээгдэнэ
   → Frontend Realtime Update-ээр redirect хийгдэнэ
   
   B. Polling (Development + Production):
   → Frontend 10 секунд тутамд POST /api/payment/check-status
   → API QPay-руу POST /v2/payment/check
   → Хэрэв PAID бол Order update хийгдэнэ
   → SMS илгээгдэнэ
   → Success page руу redirect

5. Success page харагдана
   → GET /payment/success?orderNumber=ORD-xxx
   → Захиалгын дугаар харуулна
   → SMS мэдэгдэл харуулна
```

## Түгээмэл Алдаанууд

### 1. "Failed to create QPay invoice: Bad Request"

**Шалтгаанууд**:
- ❌ Client ID эсвэл Client Secret буруу
- ❌ Invoice Code буруу
- ❌ API URL буруу (Production/Sandbox холих)
- ❌ Callback URL формат буруу
- ❌ Amount буруу формат (negative, float with many decimals)

**Шийдэл**:
1. QPay-тай холбогдож credentials баталгаажуулах
2. Test endpoint ашиглан auth шалгах
3. Terminal logs-оос дэлгэрэнгүй error харах

### 2. Webhook ирэхгүй байна

**Шалтгаанууд**:
- ❌ Localhost дээр ажиллаж байна (QPay интернетээс хандаж чадахгүй)
- ❌ Callback URL буруу
- ❌ Callback URL whitelist-д нэмэгдээгүй

**Шийдэл**:
1. Production дээр deploy хийх
2. Development дээр Manual Complete товч ашиглах
3. Polling system автоматаар ажиллана (10 секунд interval)

### 3. Success page харагдахгүй

**Шалтгаанууд**:
- ❌ payment_status PAID болоогүй байна
- ❌ Webhook болон Polling хоёулаа ажиллахгүй байна
- ❌ Frontend redirect logic ажиллахгүй байна

**Шийдэл**:
1. Terminal logs шалгах
2. Supabase orders table-ийг шалгах (payment_status column)
3. Browser console-д JavaScript алдаа байна уу шалгах

## Дараагийн Алхмууд

1. ✅ `GET /api/payment/test-qpay` endpoint-ыг дуудаж credentials шалгах
2. ✅ Terminal-д илүү дэлгэрэнгүй logs харагдах болсон
3. ✅ Payment status checking сайжирсан (QPay API-руу polling)
4. ✅ Webhook сайжирсан (илүү их logs)
5. ⏳ QPay-тай холбогдож credentials баталгаажуулах (хэрэв шаардлагатай бол)
6. ⏳ Production дээр deploy хийж webhook тестлэх
