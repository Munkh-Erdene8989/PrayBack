# 🔧 QPay Тохиргоо

## ⚠️ Одоогийн асуудал: QPay Authentication Failed

QPay-той холбогдоход **401 Unauthorized** алдаа гарч байна.

---

## 📋 Шалгах зүйлс:

### 1. QPay Credentials зөв эсэх
Одоо `.env.local` дээр:
```env
QPAY_CLIENT_ID=aylay_mn_admin
QPAY_CLIENT_SECRET=Me89897803$
QPAY_INVOICE_CODE=AYLAY_MN_INVOICE
QPAY_API_URL=https://merchant.qpay.mn/v2
```

**Шалгах:**
- ✅ Username зөв эсэх: `aylay_mn_admin`
- ✅ Password зөв эсэх: `Me89897803$`
- ✅ Invoice Code зөв эсэх: `AYLAY_MN_INVOICE`
- ✅ Production URL эсвэл Sandbox URL ашиглах вэ?

---

### 2. QPay Орчны Төрөл

QPay-д 2 орчин байдаг:

#### 🧪 **Sandbox (Test)**
```env
QPAY_API_URL=https://merchant-sandbox.qpay.mn/v2
```
- Тестийн орчин
- Үнэн хэрэгтээ төлбөр төлөгдөхгүй
- Test credentials ашиглана

#### 🚀 **Production (Бодит)**
```env
QPAY_API_URL=https://merchant.qpay.mn/v2
```
- Бодит орчин
- Жинхэнэ мөнгө шилжинэ
- Production credentials ашиглана

---

### 3. Шийдлийн Сонголтууд

#### ✅ **Сонголт 1: QPay Support-оос Шалгуулах**

QPay-ийн техникийн албатай холбогдоод:
1. Credentials зөв эсэхийг баталгаажуулах
2. Account идэвхтэй эсэхийг шалгах
3. IP whitelist хэрэгтэй эсэхийг асуух

#### 🧪 **Сонголт 2: Sandbox (Test) Руу Шилжих**

Одоо production credentials буруу байгаа бол, Sandbox руу шилжиж болно:

`.env.local` засах:
```env
# QPay Sandbox (Test)
QPAY_API_URL=https://merchant-sandbox.qpay.mn/v2
QPAY_CLIENT_ID=<sandbox_username>
QPAY_CLIENT_SECRET=<sandbox_password>
QPAY_INVOICE_CODE=<sandbox_invoice_code>
```

#### 🎭 **Сонголт 3: Mock Payment Mode**

Хөгжүүлэлтийн үед QPay байхгүй ч ажиллахын тулд mock mode нэмж болно:

```env
QPAY_MOCK_MODE=true
```

Энэ mode дээр:
- Жинхэнэ QPay API дуудахгүй
- Fake QR code үүсгэнэ
- Manual "Төлсөн" товчоор тест хийнэ

---

## 🔍 Одоогийн Алдааны Дэлгэрэнгүй

QPay auth request:
```
POST https://merchant.qpay.mn/v2/auth/token
Authorization: Basic <base64_encoded_credentials>
Response: 401 Unauthorized
```

**Учир шалтгаан:**
1. Username/password буруу
2. Account идэвхгүй байж магадгүй
3. IP restriction байж магадгүй
4. Sandbox credentials-ийг production URL дээр ашиглаж байж магадгүй

---

## 💡 Одоо Хийх Зүйл

### Хувилбар 1: QPay-д Шалгуулах
```
1. QPay support руу хандах
2. Credentials шалгуулах
3. Зөв credentials авч .env.local шинэчлэх
4. Server restart хийх
```

### Хувилбар 2: Mock Mode Ашиглах (Хөгжүүлэлтийн үед)
Agent mode руу хандвал би mock payment mode нэмж өгнө.

### Хувилбар 3: Sandbox Ашиглах
Хэрэв Sandbox credentials байвал:
```
1. .env.local дээр QPAY_API_URL-г sandbox руу солих
2. Sandbox credentials оруулах
3. Server restart
```

---

## 📞 QPay Support

Хэрэв QPay-той холбоотой асуудал байвал:
- Website: https://qpay.mn
- Support email эсвэл утас хайх
- Credentials болон account status шалгуулах

---

## 🚀 Дараагийн Алхам

**Танд хэрэгтэй зүйл:**
1. ✅ QPay credentials зөв эсэхийг баталгаажуулах
2. 🧪 ЭСВЭЛ mock payment mode нэмэх (Agent mode)
3. 🧪 ЭСВЭЛ Sandbox credentials авах

**Би юу хийж чадах вэ?**
- Mock payment mode нэмж өгч болно (test хийхэд хялбар)
- Алдааны мессеж сайжруулж болно
- QPay integration-г илүү уян хатан болгож болно

**Agent mode руу хандаарай!** 🎯
