const CONFIG = {
    BOT_TOKEN: "8848786569:AAEiMCG-b9rG6e1rgrih8LXWDba46ZkgiWc",
    CHAT_ID: "1953951548",
    INTERVAL_MINUTES: 10,
    MIN_UPVOTES: 50
};

let sentPosts = new Set();

async function getRedditPosts(subreddit) {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=20`;
        const res = await fetch(url, {
            headers: {'User-Agent': 'Mozilla/5.0'}
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data.children.map(c => c.data);
    } catch (e) {
        console.error('Reddit error:', e.message);
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
                parse_mode: 'HTML'
            })
        });
        const result = await res.json();
        return result.ok;
    } catch (e) {
        console.error('Telegram error:', e.message);
        return false;
    }
}

async function sendNews() {
    console.log('🔍 Searching for news...');
    
    const subs = ['artificial', 'MachineLearning', 'singularity', 'OpenAI'];
    let allPosts = [];
    
    for (const sub of subs) {
        const posts = await getRedditPosts(sub);
        allPosts = allPosts.concat(posts);
        await new Promise(r => setTimeout(r, 2000));
    }
    
    const valid = allPosts.filter(p => 
        p && p.title && p.score >= CONFIG.MIN_UPVOTES && !sentPosts.has(p.id)
    );
    
    if (valid.length === 0) {
        console.log('⚠️ No news found');
        return;
    }
    
    valid.sort((a, b) => b.score - a.score);
    const post = valid[0];
    
    const msg = `🤖 <b>${post.title}</b>

📊 ${post.score} رای | 💬 ${post.num_comments} کامنت

🔗 <a href="https://reddit.com${post.permalink}">مشاهده بحث</a>

#AI #هوش_مصنوعی`;
    
    const sent = await sendToTelegram(msg);
    if (sent) {
        sentPosts.add(post.id);
        console.log('✅ Sent:', post.title.substring(0, 50));
    }
}

const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Bot Active</h1><p>News sent: ' + sentPosts.size + '</p>');
}).listen(process.env.PORT || 8080);

async function main() {
    console.log('🚀 Bot started!');
    await sendNews();
    setInterval(sendNews, CONFIG.INTERVAL_MINUTES * 60 * 1000);
}

main();
