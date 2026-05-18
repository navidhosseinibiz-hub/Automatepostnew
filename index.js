const CONFIG = {
    BOT_TOKEN: "8848786569:AAEiMCG-b9rG6e1rgrih8LXWDba46ZkgiWc",
    CHAT_ID: "@Updatewithai",  // 👈 تغییر داده شد
    CHANNEL_USERNAME: "@Updatewithai",
    CHANNEL_NAME: "اخبار هوش مصنوعی و فناوری",
    INTERVAL_MINUTES: 10,
    MIN_UPVOTES: 50
};

let sentPosts = new Set();

async function getRedditPosts(subreddit) {
    try {
        const url = `https://api.reddit.com/r/${subreddit}/hot?limit=20`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'android:com.example.myredditapp:v1.2.3 (by /u/example)'
            }
        });
        if (!res.ok) {
            console.log(`⚠️ r/${subreddit}: ${res.status}`);
            return [];
        }
        const data = await res.json();
        console.log(`✅ r/${subreddit}: ${data.data.children.length} posts`);
        return data.data.children.map(c => c.data);
    } catch (e) {
        console.error(`❌ r/${subreddit}:`, e.message);
        return [];
    }
}

async function translateToFarsi(text) {
    let cleaned = text
        .replace(/<[^>]*>/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/\*/g, '')
        .replace(/\n+/g, ' ')
        .trim();
    
    if (cleaned.length > 600) {
        cleaned = cleaned.substring(0, 600) + '...';
    }
    
    return cleaned;
}

async function sendToTelegram(text) {
    try {
        const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: CONFIG.CHAT_ID,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        const result = await res.json();
        if (result.ok) {
            console.log('✅ ارسال به کانال موفق بود');
            return true;
        } else {
            console.error('❌ خطا در ارسال:', result.description);
            return false;
        }
    } catch (e) {
        console.error('❌ خطای شبکه:', e.message);
        return false;
    }
}

async function sendNews() {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 در حال جستجوی اخبار هوش مصنوعی...');
    console.log('='.repeat(50));
    
    const subs = ['artificial', 'MachineLearning', 'singularity', 'OpenAI'];
    let allPosts = [];
    
    for (const sub of subs) {
        const posts = await getRedditPosts(sub);
        allPosts = allPosts.concat(posts);
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`📊 مجموع پست‌ها: ${allPosts.length}`);
    
    const valid = allPosts.filter(p => 
        p && 
        p.title && 
        p.score >= CONFIG.MIN_UPVOTES && 
        !sentPosts.has(p.id) &&
        !p.stickied
    );
    
    console.log(`✅ پست‌های معتبر: ${valid.length}`);
    
    if (valid.length === 0) {
        console.log('⚠️ خبر جدیدی نیست، از پست‌های موجود استفاده می‌شود');
        const sorted = allPosts
            .filter(p => p && p.title)
            .sort((a, b) => b.score - a.score);
        if (sorted.length === 0) {
            console.log('❌ هیچ پستی یافت نشد');
            return;
        }
        valid.push(sorted[0]);
    }
    
    valid.sort((a, b) => b.score - a.score);
    const post = valid[0];
    
    console.log(`📌 انتخاب شد: ${post.title.substring(0, 60)}...`);
    
    let emoji = '🚀';
    const t = post.title.toLowerCase();
    if (t.includes('gpt') || t.includes('openai')) emoji = '🤖';
    else if (t.includes('claude')) emoji = '🧠';
    else if (t.includes('robot')) emoji = '🦾';
    else if (t.includes('google')) emoji = '🔮';
    
    let content = post.title;
    if (post.selftext && post.selftext.length > 50) {
        const cleaned = await translateToFarsi(post.selftext);
        content = `${post.title}\n\n${cleaned}`;
    }
    
    const msg = `${emoji} ${content}

━━━━━━━━━━━━━━━━━━━━
📢 ${CONFIG.CHANNEL_NAME}
${CONFIG.CHANNEL_USERNAME}

برای دریافت جدیدترین اخبار هوش مصنوعی، کانال را دنبال کنید 🔔`;
    
    const sent = await sendToTelegram(msg);
    if (sent) {
        sentPosts.add(post.id);
        console.log(`✅ موفق! مجموع ارسالی: ${sentPosts.size}`);
    }
    
    console.log(`⏳ خبر بعدی در ${CONFIG.INTERVAL_MINUTES} دقیقه`);
}

const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(`
<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<title>ربات خبر AI</title>
<style>
body{font-family:Arial;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:20px}
.box{background:#fff;padding:40px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;text-align:center}
h1{color:#667eea;margin:0 0 20px}
.status{background:#10b981;color:#fff;padding:15px;border-radius:10px;margin:20px 0;font-size:1.2em}
.info{background:#f3f4f6;padding:12px;border-radius:8px;margin:10px 0}
</style>
</head>
<body>
<div class="box">
<h1>🤖 ربات خبر هوش مصنوعی</h1>
<div class="status">✅ فعال</div>
<div class="info">📊 خبرهای ارسالی: ${sentPosts.size}</div>
<div class="info">⏱️ هر ${CONFIG.INTERVAL_MINUTES} دقیقه</div>
<div class="info">📢 ${CONFIG.CHANNEL_NAME}</div>
<div class="info">🆔 ${CONFIG.CHANNEL_USERNAME}</div>
</div>
</body>
</html>
    `);
}).listen(process.env.PORT || 8080, () => {
    console.log('🌐 سرور وب راه‌اندازی شد');
});

async function main() {
    console.log('\n🚀 ربات خبر هوش مصنوعی شروع شد!');
    console.log(`📡 کانال: ${CONFIG.CHANNEL_NAME} (${CONFIG.CHANNEL_USERNAME})`);
    console.log(`⏱️  بازه: ${CONFIG.INTERVAL_MINUTES} دقیقه\n`);
    
    await sendNews();
    setInterval(sendNews, CONFIG.INTERVAL_MINUTES * 60 * 1000);
}

process.on('unhandledRejection', e => console.error('❌', e));
process.on('uncaughtException', e => console.error('❌', e));

main();
