// 🤖 ربات خودکار ارسال اخبار هوش مصنوعی به تلگرام
// نسخه نهایی - حل کامل مشکل Reddit 403

const CONFIG = {
    BOT_TOKEN: process.env.BOT_TOKEN || "8848786569:AAEiMCG-b9rG6e1rgrih8LXWDba46ZkgiWc",
    CHAT_ID: process.env.CHAT_ID || "1953951548",
    INTERVAL_MINUTES: parseInt(process.env.INTERVAL_MINUTES) || 10,
    SUBREDDITS: ["artificial", "MachineLearning", "singularity", "OpenAI", "ChatGPT"],
    MIN_UPVOTES: parseInt(process.env.MIN_UPVOTES) || 50
};

let sentPosts = new Set();

async function getRedditPosts(subreddit, sort = "hot", limit = 15) {
    try {
        const url = `https://old.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`❌ خطا ${response.status} از r/${subreddit}`);
            return [];
        }
        
        const data = await response.json();
        const posts = data.data.children.map(child => child.data);
        console.log(`✅ ${posts.length} پست از r/${subreddit}`);
        return posts;
    } catch (error) {
        console.error(`❌ خطا از r/${subreddit}:`, error.message);
        return [];
    }
}

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            })
        });
        
        const result = await response.json();
        if (result.ok) {
            console.log("✅ پیام ارسال شد");
            return true;
        } else {
            console.error("❌ خطا:", result.description);
            return false;
        }
    } catch (error) {
        console.error("❌ خطای شبکه:", error.message);
        return false;
    }
}

async function selectBestNews() {
    console.log("🔍 جستجوی خبر...");
    let allPosts = [];
    
    for (const subreddit of CONFIG.SUBREDDITS) {
        const posts = await getRedditPosts(subreddit, "hot", 15);
        allPosts = allPosts.concat(posts);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`📊 کل پست‌ها: ${allPosts.length}`);
    
    const validPosts = allPosts.filter(post => {
        if (!post || !post.title) return false;
        if (post.stickied) return false;
        if (sentPosts.has(post.id)) return false;
        if (post.score < CONFIG.MIN_UPVOTES) return false;
        
        const hasText = post.selftext && post.selftext.length > 100;
        const isLink = post.url && !post.url.includes('i.redd.it') && !post.url.includes('v.redd.it');
        
        return hasText || isLink;
    });
    
    console.log(`✅ پست معتبر: ${validPosts.length}`);
    
    if (validPosts.length === 0) {
        console.log("⚠️ از پست‌های موجود استفاده می‌شود");
        const sortedPosts = allPosts
            .filter(p => p && p.title && !p.stickied)
            .sort((a, b) => b.score - a.score);
        return sortedPosts[0] || null;
    }
    
    validPosts.sort((a, b) => b.score - a.score);
    return validPosts[0];
}

function getTopicEmoji(title) {
    const t = title.toLowerCase();
    if (t.includes('gpt') || t.includes('openai')) return '🤖';
    if (t.includes('claude') || t.includes('anthropic')) return '🧠';
    if (t.includes('robot') || t.includes('figure')) return '🦾';
    if (t.includes('breakthrough') || t.includes('research')) return '🔬';
    if (t.includes('job') || t.includes('employment')) return '💼';
    if (t.includes('money') || t.includes('revenue')) return '💰';
    if (t.includes('google') || t.includes('gemini')) return '🔮';
    return '🚀';
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatPersianNews(post) {
    const emoji = getTopicEmoji(post.title);
    
    let description = '';
    if (post.selftext && post.selftext.length > 100) {
        description = post.selftext
            .substring(0, 500)
            .replace(/<[^>]*>/g, '')
            .replace(/\n+/g, '\n')
            .trim() + '...';
    } else if (post.url && !post.url.includes('reddit.com')) {
        description = `🔗 منبع خارجی موجود است`;
    } else {
        description = 'برای مشاهده جزئیات کامل روی لینک کلیک کنید.';
    }
    
    return `${emoji} <b>${post.title}</b>

${description}

📊 <b>آمار ردیت:</b>
👍 ${formatNumber(post.score)} رای | 💬 ${post.num_comments} کامنت
🔥 ${Math.round(post.upvote_ratio * 100)}% مثبت

🔗 <a href="https://reddit.com${post.permalink}">مشاهده بحث کامل</a>

#هوش_مصنوعی #AI #تکنولوژی
⏰ ${new Date().toLocaleString('fa-IR')}`;
}

async function sendNewsUpdate() {
    console.log("\n" + "=".repeat(50));
    console.log(`📰 چرخه: ${new Date().toLocaleString('fa-IR')}`);
    console.log("=".repeat(50));
    
    try {
        const post = await selectBestNews();
        
        if (!post) {
            console.log("❌ خبری یافت نشد");
            return;
        }
        
        console.log(`📌 ${post.title.substring(0, 70)}...`);
        console.log(`   Score: ${post.score} | Comments: ${post.num_comments}`);
        
        const message = formatPersianNews(post);
        const sent = await sendToTelegram(message);
        
        if (sent) {
            sentPosts.add(post.id);
            console.log(`✅ ارسال شد - مجموع: ${sentPosts.size}`);
            
            if (sentPosts.size > 1000) {
                sentPosts = new Set(Array.from(sentPosts).slice(-500));
                console.log("🧹 حافظه پاک شد");
            }
        }
    } catch (error) {
        console.error("❌ خطا:", error);
    }
    
    console.log(`⏳ بعدی در ${CONFIG.INTERVAL_MINUTES} دقیقه`);
}

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<title>AI News Bot</title>
<style>
body{font-family:Arial;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;margin:0}
.container{background:#fff;padding:40px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:600px}
h1{color:#667eea;text-align:center;margin-bottom:30px}
.status{background:#10b981;color:#fff;padding:15px;border-radius:10px;text-align:center;font-size:1.2em;margin-bottom:20px}
.info{background:#f3f4f6;padding:15px;border-radius:10px;margin:10px 0;border-right:4px solid #667eea}
</style>
</head>
<body>
<div class="container">
<h1>🤖 ربات خبر AI</h1>
<div class="status">✅ فعال</div>
<div class="info">⏰ ${new Date().toLocaleString('fa-IR')}</div>
<div class="info">📊 خبرها: ${sentPosts.size}</div>
<div class="info">⏱️ هر ${CONFIG.INTERVAL_MINUTES} دقیقه</div>
<div class="info">📡 ${CONFIG.CHAT_ID}</div>
</div>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`🌐 سرور پورت ${PORT}`);
});

async function main() {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 ربات شروع شد!");
    console.log("=".repeat(60));
    console.log(`📡 کانال: ${CONFIG.CHAT_ID}`);
    console.log(`⏱️  بازه: ${CONFIG.INTERVAL_MINUTES} دقیقه`);
    console.log(`📊 حداقل: ${CONFIG.MIN_UPVOTES} آپ‌وت`);
    console.log(`🌐 منابع: ${CONFIG.SUBREDDITS.join(', ')}`);
    console.log("=".repeat(60) + "\n");
    
    await sendNewsUpdate();
    
    setInterval(async () => {
        await sendNewsUpdate();
    }, CONFIG.INTERVAL_MINUTES * 60 * 1000);
}

process.on('unhandledRejection', (error) => {
    console.error('❌ Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception:', error);
});

main().catch(console.error);
