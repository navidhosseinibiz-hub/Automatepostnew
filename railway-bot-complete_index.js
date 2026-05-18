// 🤖 ربات خودکار ارسال اخبار هوش مصنوعی به تلگرام
// نسخه Railway - بدون نیاز به dependencies خارجی

const CONFIG = {
    BOT_TOKEN: process.env.BOT_TOKEN || "8848786569:AAEiMCG-b9rG6e1rgrih8LXWDba46ZkgiWc",
    CHAT_ID: process.env.CHAT_ID || "1953951548",
    INTERVAL_MINUTES: parseInt(process.env.INTERVAL_MINUTES) || 10,
    SUBREDDITS: ["artificial", "MachineLearning", "singularity", "OpenAI", "ChatGPT"],
    MIN_UPVOTES: parseInt(process.env.MIN_UPVOTES) || 100
};

let sentPosts = new Set();

// ============ توابع Reddit ============
async function getRedditPosts(subreddit, sort = "hot", limit = 10) {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'TelegramAINewsBot/1.0' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.data.children.map(child => child.data);
    } catch (error) {
        console.error(`❌ خطا در دریافت از r/${subreddit}:`, error.message);
        return [];
    }
}

// ============ توابع تلگرام ============
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
            console.error("❌ خطا در ارسال:", result.description);
            return false;
        }
    } catch (error) {
        console.error("❌ خطای شبکه:", error.message);
        return false;
    }
}

// ============ انتخاب خبر ============
async function selectBestNews() {
    console.log("🔍 جستجوی خبر...");
    let allPosts = [];
    
    for (const subreddit of CONFIG.SUBREDDITS) {
        const posts = await getRedditPosts(subreddit, "hot", 10);
        allPosts = allPosts.concat(posts);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // فیلتر کردن خبرهای مناسب
    const validPosts = allPosts.filter(post => 
        post && 
        post.score >= CONFIG.MIN_UPVOTES && 
        !sentPosts.has(post.id) &&
        !post.stickied &&
        post.title
    );
    
    if (validPosts.length === 0) {
        console.log("⚠️ خبر جدیدی یافت نشد، از خبرهای موجود استفاده می‌شود");
        const sortedPosts = allPosts.filter(p => p && p.title).sort((a, b) => b.score - a.score);
        return sortedPosts[0] || null;
    }
    
    validPosts.sort((a, b) => b.score - a.score);
    return validPosts[0];
}

// ============ فرمت پیام ============
function getTopicEmoji(title) {
    const t = title.toLowerCase();
    if (t.includes('gpt') || t.includes('openai')) return '🤖';
    if (t.includes('claude') || t.includes('anthropic')) return '🧠';
    if (t.includes('robot') || t.includes('figure')) return '🦾';
    if (t.includes('breakthrough') || t.includes('research')) return '🔬';
    if (t.includes('job') || t.includes('employment')) return '💼';
    if (t.includes('money') || t.includes('revenue')) return '💰';
    return '🚀';
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatPersianNews(post) {
    const emoji = getTopicEmoji(post.title);
    const description = post.selftext 
        ? post.selftext.substring(0, 300).replace(/<[^>]*>/g, '').trim() + '...'
        : 'برای مشاهده جزئیات بیشتر روی لینک کلیک کنید.';
    
    return `${emoji} <b>${post.title}</b>

${description}

📊 <b>آمار ردیت:</b>
👍 ${formatNumber(post.score)} رای | 💬 ${post.num_comments} کامنت
🔥 ${Math.round(post.upvote_ratio * 100)}% نسبت مثبت

🔗 <a href="https://reddit.com${post.permalink}">مشاهده بحث کامل</a>

#هوش_مصنوعی #AI #تکنولوژی
⏰ ${new Date().toLocaleString('fa-IR')}`;
}

// ============ ارسال خبر ============
async function sendNewsUpdate() {
    console.log("\n" + "=".repeat(50));
    console.log(`📰 چرخه جدید: ${new Date().toLocaleString('fa-IR')}`);
    console.log("=".repeat(50));
    
    try {
        const post = await selectBestNews();
        
        if (!post) {
            console.log("❌ هیچ خبری یافت نشد");
            return;
        }
        
        console.log(`📌 ${post.title.substring(0, 60)}...`);
        console.log(`   Score: ${post.score} | Comments: ${post.num_comments}`);
        
        const message = formatPersianNews(post);
        const sent = await sendToTelegram(message);
        
        if (sent) {
            sentPosts.add(post.id);
            console.log(`✅ ارسال شد - مجموع: ${sentPosts.size}`);
            
            // پاکسازی حافظه
            if (sentPosts.size > 1000) {
                const postsArray = Array.from(sentPosts);
                sentPosts = new Set(postsArray.slice(-500));
                console.log("🧹 حافظه پاکسازی شد");
            }
        }
    } catch (error) {
        console.error("❌ خطای غیرمنتظره:", error);
    }
    
    console.log(`⏳ خبر بعدی در ${CONFIG.INTERVAL_MINUTES} دقیقه...`);
}

// ============ وب سرور (برای Health Check) ============
const http = require('http');

const server = http.createServer((req, res) => {
    const now = new Date();
    
    res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    
    res.end(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI News Bot - Status</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .container { 
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 600px;
                    width: 100%;
                }
                h1 { 
                    color: #667eea;
                    margin-bottom: 30px;
                    font-size: 2em;
                    text-align: center;
                }
                .status { 
                    background: #10b981;
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 1.2em;
                    margin-bottom: 30px;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                .info-grid {
                    display: grid;
                    gap: 15px;
                    margin-top: 20px;
                }
                .info-item {
                    background: #f3f4f6;
                    padding: 15px;
                    border-radius: 10px;
                    border-left: 4px solid #667eea;
                }
                .info-label {
                    color: #6b7280;
                    font-size: 0.9em;
                    margin-bottom: 5px;
                }
                .info-value {
                    color: #111827;
                    font-size: 1.1em;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 ربات خبر هوش مصنوعی</h1>
                
                <div class="status">
                    ✅ ربات در حال اجرا است
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">⏰ آخرین بررسی</div>
                        <div class="info-value">${now.toLocaleString('fa-IR')}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">📊 خبرهای ارسال شده</div>
                        <div class="info-value">${sentPosts.size} خبر</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">⏱️ بازه زمانی</div>
                        <div class="info-value">هر ${CONFIG.INTERVAL_MINUTES} دقیقه</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">📡 کانال</div>
                        <div class="info-value">${CONFIG.CHAT_ID}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">📊 حداقل آپ‌وت</div>
                        <div class="info-value">${CONFIG.MIN_UPVOTES}+</div>
                    </div>
                </div>
                
                <div class="footer">
                    Railway Deployment • Node.js ${process.version}
                </div>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🌐 وب سرور فعال در پورت ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}`);
});

// ============ شروع ربات ============
async function main() {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 ربات خبر هوش مصنوعی شروع به کار کرد!");
    console.log("=".repeat(60));
    console.log(`📡 کانال: ${CONFIG.CHAT_ID}`);
    console.log(`⏱️  بازه زمانی: هر ${CONFIG.INTERVAL_MINUTES} دقیقه`);
    console.log(`📊 حداقل آپ‌وت: ${CONFIG.MIN_UPVOTES}`);
    console.log(`🌐 Subreddits: ${CONFIG.SUBREDDITS.join(', ')}`);
    console.log("=".repeat(60) + "\n");
    
    // ارسال اولین خبر بلافاصله
    await sendNewsUpdate();
    
    // تنظیم interval برای ارسال‌های بعدی
    setInterval(async () => {
        await sendNewsUpdate();
    }, CONFIG.INTERVAL_MINUTES * 60 * 1000);
}

// مدیریت خطاها
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

// اجرای برنامه
main().catch(console.error);
