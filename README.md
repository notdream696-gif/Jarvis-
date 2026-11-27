# JARVIS Backend

هذا سيرفر بداية لمشروع JARVIS. يحتوي على:
- `GET /health` لفحص عمل السيرفر.
- `POST /api/chat` لإرسال رسالة إلى Groq.
- مفاتيح API تبقى في Environment ولا توضع داخل تطبيق Android أو GitHub.

## المتطلبات
Node.js 18 أو أحدث.

## التشغيل محلياً
1. ثبّت الحزم:
   `npm install`
2. انسخ `.env.example` إلى `.env`.
3. أضف `GROQ_API_KEY` واسم موديل متاح بحسابك في `GROQ_MODEL`.
4. شغّل:
   `npm start`

## اختبار
افتح:
`http://localhost:3000/health`

ولإرسال رسالة:
`POST http://localhost:3000/api/chat`
مع JSON:
`{"message":"مرحبا جارفيس"}`

## النشر على Render
- أنشئ مستودع GitHub وارفع الملفات.
- في Render اختر New Web Service واربط المستودع.
- Build Command: `npm install`
- Start Command: `npm start`
- أضف `GROQ_API_KEY` و `GROQ_MODEL` من Environment في Render.
- لا ترفع ملف `.env` إلى GitHub.

ملاحظة: هذا إصدار أولي للمحادثة فقط. البحث والصوت وتوليد الصور والفيديو وربط الشاشة تُضاف كمراحل منفصلة.
