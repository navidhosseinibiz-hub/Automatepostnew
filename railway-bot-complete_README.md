# 🤖 Telegram AI News Bot

ربات خودکار ارسال اخبار هوش مصنوعی از Reddit به کانال تلگرام - به زبان فارسی

## 🚀 نصب و راه‌اندازی در Railway

### مرحله 1: آپلود فایل‌ها به GitHub

1. تمام فایل‌های این پوشه را در یک repository جدید قرار دهید
2. فایل‌های مورد نیاز:
   - `index.js` ✅
   - `package.json` ✅
   - `README.md` (اختیاری)
   - `.gitignore` (اختیاری)

### مرحله 2: Deploy در Railway

1. به [railway.app](https://railway.app) بروید
2. با GitHub وارد شوید
3. **New Project** → **Deploy from GitHub repo**
4. Repository خود را انتخاب کنید
5. Railway به صورت خودکار deploy می‌کند!

### مرحله 3: تنظیم متغیرهای محیطی (اختیاری)

در Railway، تب **Variables** را باز کنید و این متغیرها را اضافه کنید:

```
BOT_TOKEN=8848786569:AAEiMCG-b9rG6e1rgrih8LXWDba46ZkgiWc
CHAT_ID=1953951548
INTERVAL_MINUTES=10
MIN_UPVOTES=100
```

**نکته:** اگر متغیرها را تنظیم نکنید، مقادیر پیش‌فرض از کد استفاده می‌شود.

---

## ⚙️ تنظیمات

### تغییر کانال تلگرام:

در فایل `index.js` خط 6:
```javascript
CHAT_ID: process.env.CHAT_ID || "YOUR_CHANNEL_ID",
```

یا در Railway Variables:
```
CHAT_ID=@your_channel
```

### تغییر بازه زمانی:

```javascript
INTERVAL_MINUTES: 10  // هر 10 دقیقه
```

### تغییر حداقل آپ‌وت:

```javascript
MIN_UPVOTES: 100  // خبرهای با حداقل 100 آپ‌وت
```

---

## 📊 ویژگی‌ها

- ✅ **ارسال خودکار** هر 10 دقیقه (قابل تنظیم)
- ✅ **فیلتر هوشمند** خبرهای با کیفیت بالا
- ✅ **جلوگیری از تکرار** خبرها
- ✅ **فرمت فارسی زیبا** با ایموجی
- ✅ **5 Subreddit** محبوب AI
- ✅ **وب سرور** برای Health Check
- ✅ **بدون dependency** خارجی

---

## 🌐 Subreddits پیش‌فرض

- **r/artificial** - اخبار عمومی AI
- **r/MachineLearning** - تحقیقات و مقالات
- **r/singularity** - آینده AI و AGI
- **r/OpenAI** - اخبار OpenAI و GPT
- **r/ChatGPT** - بحث‌های ChatGPT

---

## 🔧 سفارشی‌سازی Subreddits

در فایل `index.js` خط 9:

```javascript
SUBREDDITS: [
    "artificial",
    "MachineLearning", 
    "singularity",
    "OpenAI",
    "ChatGPT"
]
```

می‌توانید subreddit‌های دلخواه خود را اضافه کنید:

```javascript
SUBREDDITS: [
    "artificial",
    "LocalLLaMA",      // مدل‌های محلی
    "StableDiffusion", // تولید تصویر
    "ArtificialInteligence"
]
```

---

## 🩺 Health Check

بعد از deploy، Railway یک URL به شما می‌دهد. با باز کردن آن URL، وضعیت ربات را ببینید:

```
https://your-app.railway.app
```

صفحه نمایش می‌دهد:
- ✅ وضعیت ربات (فعال/غیرفعال)
- 📊 تعداد خبرهای ارسال شده
- ⏰ آخرین بررسی
- ⏱️ بازه زمانی
- 📡 کانال تلگرام

---

## 🐛 عیب‌یابی

### ربات پیام ارسال نمی‌کند؟

1. **بررسی Chat ID:**
   - آیا بات را به کانال اضافه کرده‌اید؟
   - آیا دسترسی "Post Messages" دارد؟

2. **بررسی Logs در Railway:**
   - تب **Deployments** → **View Logs**
   - پیام‌های خطا را بخوانید

3. **تست دستی:**
   - URL ربات را باز کنید
   - آیا صفحه Status نمایش می‌دهد؟

### خطای "Failed to build"?

- مطمئن شوید `package.json` موجود است
- مطمئن شوید `"start": "node index.js"` در scripts است

---

## 📝 لاگ‌های مفید

ربات این اطلاعات را log می‌کند:

```
🚀 ربات خبر هوش مصنوعی شروع به کار کرد!
📡 کانال: 1953951548
⏱️  بازه زمانی: هر 10 دقیقه
📊 حداقل آپ‌وت: 100
```

هر 10 دقیقه:
```
📰 چرخه جدید: 2026/05/18 12:30:00
🔍 جستجوی خبر...
📌 GPT-5.5 autonomously spent 150+ hours...
   Score: 621 | Comments: 31
✅ پیام ارسال شد
✅ ارسال شد - مجموع: 15
⏳ خبر بعدی در 10 دقیقه...
```

---

## 💡 نکات مهم

1. **رایگان بودن Railway:**
   - 500 ساعت رایگان در ماه
   - برای این ربات کافی است (24/7 = 720 ساعت)
   - اگر تمام شد، با کارت اعتباری ادامه دهید ($5/ماه)

2. **مصرف منابع:**
   - CPU: بسیار کم
   - RAM: ~50MB
   - Network: ~10MB/روز

3. **پایداری:**
   - Railway خیلی پایدارتر از Replit است
   - Restart خودکار در صورت خطا
   - Health check داخلی

---

## 🆘 پشتیبانی

- **مشکل فنی؟** Issue بسازید در GitHub
- **سوال دارید؟** به @navidvideos در تلگرام پیام دهید
- **پیشنهاد؟** Pull Request بفرستید!

---

## 📄 لایسنس

MIT License - استفاده آزاد برای همه

---

## 🙏 تشکر

- **Reddit API** - برای دسترسی رایگان
- **Telegram Bot API** - برای ارسال پیام‌ها
- **Railway** - برای هاست رایگان

---

**ساخته شده با ❤️ برای جامعه AI فارسی‌زبان**
