# بدقة — Bidiqqah

نظام كشف الاحتيال في فواتير الشركات، مبني على معايير **ZATCA** مع معمارية **Multi-Agent** للتحليل.

---

## المتطلبات (Demo)

| الأداة | مطلوب؟ |
|--------|--------|
| Node.js 18+ | ✅ |
| npm | ✅ |
| OpenAI API Key | ✅ للتحليل الذكي |
| Supabase | ❌ لاحقاً |

## تشغيل سريع (بدون قاعدة بيانات)

```powershell
npm install
copy .env.example .env
# ضع OPENAI_API_KEY في .env
npm run dev
```

افتح `http://localhost:3000` وارفع فاتورة. **لا حاجة لـ Supabase الآن.**

---

## 1. تثبيت المشروع

```bash
cd ruba
npm install
```

---

## 2. إعداد المتغيرات البيئية

انسخ ملف المثال وعدّله:

```bash
copy .env.example .env
```

أو على PowerShell:

```powershell
Copy-Item .env.example .env
```

### القيم المطلوبة في `.env`

```env
# ── Supabase PostgreSQL ──
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ── Supabase API ──
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="invoices"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_STORAGE_BUCKET="invoices"

# ── OpenAI (اختياري — بدونه يعمل النظام بتحليل محلي) ──
OPENAI_API_KEY="sk-..."
```

### من أين تحصل على القيم؟

1. **Supabase** → [supabase.com](https://supabase.com) → New Project
2. **Database URL** → Settings → Database → Connection string → **Transaction pooler** (port 6543)
3. **Direct URL** → نفس الصفحة → **Session mode** (port 5432)
4. **API Keys** → Settings → API → `anon` + `service_role`
5. **Storage Bucket** → Storage → New bucket → اسم: `invoices` → Public: ✅

---

## 3. إعداد قاعدة البيانات

```bash
npx prisma migrate deploy
npx prisma generate
```

> إذا كانت هذه أول مرة، استخدم:
> ```bash
> npx prisma migrate dev --name init
> ```

---

## 4. تشغيل الموقع

### وضع التطوير (Development)

```bash
npm run dev
```

افتح المتصفح على: **http://localhost:3000**

> إذا كان المنفذ 3000 مشغولاً، Next.js سيختار 3001 أو 3002 تلقائياً — راقب رسالة Terminal.

### وضع الإنتاج (Production)

```bash
npm run build
npm start
```

---

## 5. كيف تختبر النظام؟

1. افتح **http://localhost:3000**
2. اسحب فاتورة (PDF / JPG / PNG / XML) إلى منطقة الرفع
3. سترى:
   - **رفع إلى Supabase Storage** (شريط تقدم)
   - **Agentic Debate** — 4 نوافذ terminal تبث سجلات الوكلاء
   - **نتيجة التحليل** — درجة المخاطرة + تفاصيل كل وكيل
4. بدّل اللغة من زر **EN / عربي** في شريط التنقل

### أنواع الملفات المدعومة

| النوع | الامتداد |
|-------|----------|
| PDF | `.pdf` |
| صور | `.jpg` `.jpeg` `.png` `.webp` `.tiff` |
| XML (ZATCA UBL) | `.xml` |

الحد الأقصى: **25 MB**

---

## 6. معمارية النظام

```
Frontend (DropZone)
  │
  ├─ 1. رفع الملف → Supabase Storage Bucket
  ├─ 2. POST /api/analyze { fileUrl, fileName, mimeType, fileSize }
  │
  └─ API Pipeline (Promise.all):
       ├─ decodeZatcaQr()      → فك TLV + قواعد BR-KSA
       ├─ runVisionAgent()     → مقارنة المرئي vs QR
       ├─ runForensicsAgent()  → تحليل metadata الملف
       └─ runMarketAgent()     → منطق التسعير التجاري
            │
            ├─ Hard Override (إن وُجد):
            │    • visualTotal ≠ QR Tag 4  → FRAUD 100%
            │    • isTampered = true       → FRAUD 100%
            │
            └─ Consolidated JSON → PostgreSQL (Supabase)
```

---

## 7. قواعد ZATCA المُطبَّقة

| الكود | الوصف |
|-------|-------|
| `BR-KSA-04` | اسم البائع (Tag 1) |
| `BR-KSA-25` | تاريخ الفاتورة ISO 8601 (Tag 3) |
| `BR-KSA-40` | رقم الضريبة 15 رقم (Tag 2) |
| `BR-CO-17` | حساب ضريبة الفئة (15%) |
| `BR-KSA-50` | حساب ضريبة البند |
| `BR-KSA-57` | هاش XML (Tag 6) |
| `BR-KSA-58` | التوقيع ECDSA (Tag 7) |
| `BR-KSA-61` | سلسلة هاش الفاتورة السابقة |
| `HARD-OVERRIDE-XX` | تجاوز قسري → FRAUD فوري |

---

## 8. هيكل المشروع

```
src/
├── app/
│   ├── page.tsx              ← لوحة التحكم الرئيسية
│   ├── layout.tsx            ← RTL + Tajawal font
│   └── api/analyze/route.ts  ← Multi-Agent API
├── components/
│   ├── layout/Navbar.tsx
│   └── dashboard/
│       ├── DropZone.tsx       ← رفع + state machine
│       ├── AgenticDebate.tsx  ← 4 terminal panels
│       ├── AnalysisResult.tsx ← عرض النتائج
│       └── StatCard.tsx
├── lib/
│   ├── supabase.ts            ← Server-side storage
│   ├── supabase-client.ts     ← Browser-side upload
│   ├── db.ts                  ← Prisma client
│   ├── zatca/
│   │   ├── tlv-decoder.ts     ← فك TLV (9 tags)
│   │   ├── qr-extractor.ts    ← استخراج QR
│   │   └── validator.ts       ← قواعد BR-KSA
│   └── agents/
│       ├── vision-agent.ts    ← GPT-4o Vision
│       ├── forensics-agent.ts ← PDF metadata
│       └── market-agent.ts    ← Commercial logic
prisma/
└── schema.prisma              ← PostgreSQL schema
```

---

## 9. استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `Port 3000 is in use` | استخدم المنفذ الذي يظهر في Terminal (3001/3002) |
| `Failed to fetch file` | تأكد من إعداد Supabase Storage bucket `invoices` |
| `Analysis pipeline failed` | تحقق من `DATABASE_URL` في `.env` |
| `Upload failed` | تأكد من `NEXT_PUBLIC_SUPABASE_*` keys |
| الوكلاء لا تستخدم AI | أضف `OPENAI_API_KEY` صالح — بدونه يعمل fallback محلي |
| `prisma migrate` fails | استخدم `DIRECT_URL` (port 5432) وليس pooler URL |

---

## 10. أوامر مفيدة

```bash
npm run dev          # تشغيل التطوير
npm run build        # بناء الإنتاج
npm run lint         # فحص الكود
npx prisma studio    # واجهة قاعدة البيانات
npx tsc --noEmit     # فحص TypeScript
```

---

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** + shadcn/ui
- **Framer Motion**
- **Prisma** + **PostgreSQL** (Supabase)
- **Supabase Storage**
- **Vercel AI SDK** + **OpenAI GPT-4o**
- **ZATCA TLV Decoder** (deterministic)
