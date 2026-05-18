const CONFIG = {
    BOT_TOKEN: "8848786569:AAEiMCG-b9rG6e1rgrih8LXWDba46ZkgiWc",
    CHAT_ID: "1953951548",
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
                disable_web_page_preview: false
            })
        });
        const result = await res.json();
        if (result.ok) {
            console.log('✅ Sent to Telegram');
            return true;
        } else {
            console.error('❌ Telegram error:', result.description);
            return false;
        }
    } catch (e) {
        console.error('❌ Telegram error:', e.message);
        return false;
    }
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

async function sendNews() {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Searching for AI news...');
    console.log('='.repeat(50));
    
    const subs = ['artificial', 'MachineLearning', 'singularity', 'OpenAI'];
    let allPosts = [];
    
    for (const sub of subs) {
        const posts = await getRedditPosts(sub);
        allPosts = allPosts.concat(posts);
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`📊 Total posts: ${allPosts.length}`);
    
    const valid = allPosts.filter(p => 
        p && 
        p.title && 
        p.score >= CONFIG.MIN_UPVOTES && 
        !sentPosts.has(p.id) &&
        !p.stickied
    );
    
    console.log(`✅ Valid posts: ${valid.length}`);
    
    if (valid.length === 0) {
        console.log('⚠️ No new posts, using existing ones');
        const sorted = allPosts
            .filter(p => p && p.title)
            .sort((a, b) => b.score - a.score);
        if (sorted.length === 0) {
            console.log('❌ No posts at all');
            return;
        }
        valid.push(sorted[0]);
    }
    
    valid.sort((a, b) => b.score - a.score);
    const post = valid[0];
    
    console.log(`📌 Selected: ${post.title.substring(0, 60)}...`);
    console.log(`   Score: ${post.score} | Comments: ${post.num_comments}`);
    
    let emoji = '🚀';
    const t = post.title.toLowerCase();
    if (t.includes('gpt') || t.includes('openai')) emoji = '🤖';
    else if (t.includes('claude')) emoji = '🧠';
    else if (t.includes('robot')) emoji = '🦾';
    else if (t.includes('google')) emoji = '🔮';
    
    const msg = `${emoji} <b>${post.title}</b>

📊 <b>آمار ردیت:</b>
👍 ${formatNumber(post.score)} رای | 💬 ${post.num_comments} کامنت
🔥 ${Math.round(post.upvote_ratio * 100)}% مثبت

🔗 <a href="https://reddit.com${post.permalink}">مشاهده بحث کامل</a>

#هوش_مصنوعی #AI #تکنولوژی
⏰ ${new Date().toLocaleString('fa-IR')}`;
    
    const sent = await sendToTelegram(msg);
    if (sent) {
        sentPosts.add(post.id);
        console.log(`✅ Success! Total sent: ${sentPosts.size}`);
    }
    
    console.log(`⏳ Next update in ${CONFIG.INTERVAL_MINUTES} minutes`);
}

const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(`
<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<title>AI News Bot</title>
<style>
body{font-family:Arial;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:20px}
.box{background:#fff;padding:40px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;text-align:center}
h1{color:#667eea;margin:0 0 20px}
.status{background:#10b981;color:#fff;padding:15px;border-radius:10px;margin:20px 0;font-size:1.2em}
.info{background:#f3f4f6;padding:12px;border-radius:8px;margin:10px 0;text-align:right}
</style>
</head>
<body>
<div class="box">
<h1>🤖 ربات خبر AI</h1>
<div class="status">✅ فعال و در حال اجرا</div>
<div class="info">📊 خبرهای ارسالی: ${sentPosts.size}</div>
<div class="info">⏰ آخرین بررسی: ${new Date().toLocaleString('fa-IR')}</div>
<div class="info">⏱️ بازه: هر ${CONFIG.INTERVAL_MINUTES} دقیقه</div>
</div>
</body>
</html>
    `);
}).listen(process.env.PORT || 8080, () => {
    console.log('🌐 Web server started on port', process.env.PORT || 8080);
});

async function main() {
    console.log('\n🚀 AI News Bot Started!');
    console.log(`📡 Channel: ${CONFIG.CHAT_ID}`);
    console.log(`⏱️  Interval: ${CONFIG.INTERVAL_MINUTES} minutes`);
    console.log(`📊 Min upvotes: ${CONFIG.MIN_UPVOTES}\n`);
    
    await sendNews();
    setInterval(sendNews, CONFIG.INTERVAL_MINUTES * 60 * 1000);
}

process.on('unhandledRejection', e => console.error('❌ Rejection:', e));
process.on('uncaughtException', e => console.error('❌ Exception:', e));

main();
