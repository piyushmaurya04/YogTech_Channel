const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * YouTube RSS Video Fetcher
 * Fetches videos from YouTube channel RSS feed and saves to JSON
 * 
 * Usage: node fetch-videos.js YOUR_CHANNEL_ID
 * Example: node fetch-videos.js UCv-your-channel-id
 */

// Replace with your YouTube Channel ID
const CHANNEL_ID = process.argv[2] || 'UCZQQ2qXXBpO7wwSfwX_8vFg';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const OUTPUT_FILE = path.join(__dirname, 'data', 'videos.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

/**
 * Simple XML Parser (no dependencies needed)
 */
function parseXML(xmlString) {
    const entries = [];
    
    // Extract entry nodes
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    
    while ((match = entryRegex.exec(xmlString)) !== null) {
        const entryContent = match[1];
        
        // Extract fields
        const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(entryContent);
        const idMatch = /<yt:videoId>([\s\S]*?)<\/yt:videoId>/.exec(entryContent);
        const publishedMatch = /<published>([\s\S]*?)<\/published>/.exec(entryContent);
        const descriptionMatch = /<media:description>([\s\S]*?)<\/media:description>/.exec(entryContent);
        const thumbnailMatch = /<media:thumbnail url="([^"]*)"/.exec(entryContent);
        
        if (idMatch) {
            const videoId = idMatch[1].trim();
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
            const published = publishedMatch ? publishedMatch[1].trim() : '';
            const description = descriptionMatch ? descriptionMatch[1].trim() : '';
            const thumbnail = thumbnailMatch ? thumbnailMatch[1] : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            
            // Format date
            const publishDate = new Date(published).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            entries.push({
                id: videoId,
                title: title,
                description: description,
                thumbnail: thumbnail,
                published: publishDate,
                url: `https://www.youtube.com/watch?v=${videoId}`
            });
        }
    }
    
    return entries;
}

/**
 * Fetch videos from YouTube RSS feed
 */
function fetchVideos() {
    console.log('🎥 Fetching videos from YouTube channel...');
    console.log(`📡 Channel ID: ${CHANNEL_ID}`);
    console.log(`🔗 RSS URL: ${RSS_URL}\n`);
    
    https.get(RSS_URL, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
            data += chunk;
        });
        
        response.on('end', () => {
            try {
                const videos = parseXML(data);
                
                if (videos.length === 0) {
                    console.error('❌ Error: No videos found. Check your Channel ID.');
                    console.log('\n📝 How to find your Channel ID:');
                    console.log('1. Go to your YouTube channel');
                    console.log('2. Click on "About" tab');
                    console.log('3. Look for the Channel ID (starts with UC)');
                    console.log('4. Run: node fetch-videos.js YOUR_CHANNEL_ID\n');
                    return;
                }
                
                // Save to file
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(videos, null, 2));
                
                console.log(`✅ Success! Fetched ${videos.length} videos`);
                console.log(`💾 Saved to: ${OUTPUT_FILE}\n`);
                console.log('📊 Latest Videos:');
                videos.slice(0, 5).forEach((video, index) => {
                    console.log(`${index + 1}. ${video.title}`);
                    console.log(`   📅 ${video.published}`);
                    console.log(`   🔗 ${video.url}\n`);
                });
                
            } catch (error) {
                console.error('❌ Error parsing videos:', error.message);
            }
        });
        
    }).on('error', (error) => {
        console.error('❌ Error fetching from YouTube:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('- Check if your Channel ID is correct');
        console.log('- Check your internet connection');
        console.log('- Make sure your channel is public');
        console.log('- YouTube RSS feeds are available for all public channels\n');
    });
}

// Run the script
console.log('╔════════════════════════════════════════╗');
console.log('║   YogTech YouTube Video Fetcher   ║');
console.log('╚════════════════════════════════════════╝\n');

if (CHANNEL_ID.includes('YOUR-CHANNEL-ID') || CHANNEL_ID === 'UC-YOUR-CHANNEL-ID-HERE') {
    console.error('❌ Error: Please provide your YouTube Channel ID\n');
    console.log('Usage: node fetch-videos.js YOUR_CHANNEL_ID\n');
    console.log('Example: node fetch-videos.js UC-1234567890abcdefghijklmn\n');
    console.log('📝 How to find your Channel ID:');
    console.log('1. Go to your YouTube channel');
    console.log('2. Click on "About" tab');
    console.log('3. Look for the Channel ID (starts with UC)');
    console.log('4. Copy and paste it in the command above\n');
    process.exit(1);
}

fetchVideos();
