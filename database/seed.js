require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./db');

// Models
const Anime = require('../models/Anime');
const Episode = require('../models/Episode');
const User = require('../models/User');
const Comment = require('../models/Comment');
const WatchHistory = require('../models/WatchHistory');
const Watchlist = require('../models/Watchlist');

async function seed() {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clear existing data
    await Promise.all([
        Anime.deleteMany({}),
        Episode.deleteMany({}),
        User.deleteMany({}),
        Comment.deleteMany({}),
        WatchHistory.deleteMany({}),
        Watchlist.deleteMany({})
    ]);

    // --- Demo users ---
    const demoUser = await User.create({
        username: 'demo',
        email: 'demo@anistream.com',
        password_hash: bcrypt.hashSync('demo123', 10),
        role: 'user'
    });
    const adminUser = await User.create({
        username: 'admin',
        email: 'admin@anistream.com',
        password_hash: bcrypt.hashSync('admin123', 10),
        role: 'admin'
    });

    // --- Sample Anime ---
    const animeData = [
        {
            title: 'Jujutsu Kaisen Season 3',
            title_en: 'Sorcery Fight Season 3',
            synopsis: 'เรื่องราวของอิตาโดริ ยูจิ นักเรียนมัธยมปลายที่ได้กลืนกินนิ้วของราชาคำสาป ริวเมน สุคุนะ และก้าวเข้าสู่โลกแห่งเวทมนตร์คาถา ซีซั่น 3 ศึกชิงอำนาจแห่งเมืองเวทย์มนตร์',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1792/138022l.jpg',
            trailer_url: '',
            rating: 8.7,
            status: 'airing',
            year: 2025,
            season: 'winter',
            studio: 'MAPPA',
            total_episodes: 24,
            genres: ['action', 'supernatural', 'shounen']
        },
        {
            title: 'Solo Leveling Season 2',
            title_en: 'Solo Leveling: Arise from the Shadow',
            synopsis: 'ซองจินอู ฮันเตอร์อันดับ E ที่อ่อนแอที่สุด ได้รับ "ระบบ" ลึกลับที่ทำให้เขาเลเวลอัพได้อย่างไม่มีขีดจำกัด กลายเป็นนักล่าที่แข็งแกร่งที่สุดในโลก',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1137/142erta.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1137/142erta.jpg',
            trailer_url: '',
            rating: 8.5,
            status: 'airing',
            year: 2025,
            season: 'winter',
            studio: 'A-1 Pictures',
            total_episodes: 13,
            genres: ['action', 'fantasy', 'isekai']
        },
        {
            title: 'Demon Slayer: Infinity Castle Arc',
            title_en: 'Kimetsu no Yaiba: Infinity Castle',
            synopsis: 'ทันจิโร่และเพื่อนๆ เตรียมต่อสู้ครั้งสุดท้ายกับมุซัน คิบุทสึจิ ในปราสาทนิรันดร์ที่ไม่มีวันจบสิ้น สุดยอดการต่อสู้ที่จะตัดสินชะตาของมวลมนุษยชาติ',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
            trailer_url: '',
            rating: 9.1,
            status: 'upcoming',
            year: 2025,
            season: 'spring',
            studio: 'ufotable',
            total_episodes: 0,
            genres: ['action', 'supernatural', 'shounen']
        },
        {
            title: 'Attack on Titan: The Final Season',
            title_en: 'Shingeki no Kyojin: The Final Season',
            synopsis: 'มนุษยชาติเผชิญหน้ากับภัยคุกคามจากเหล่าไททัน เอเรน เยเกอร์และเพื่อนๆ ต้องสู้เพื่อเปิดเผยความจริงของโลก ในศึกสุดท้ายที่จะเปลี่ยนแปลงทุกสิ่ง',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1000/110531.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1000/110531l.jpg',
            trailer_url: '',
            rating: 9.0,
            status: 'completed',
            year: 2023,
            season: 'fall',
            studio: 'MAPPA',
            total_episodes: 16,
            genres: ['action', 'drama', 'mystery', 'seinen']
        },
        {
            title: 'One Piece',
            title_en: 'One Piece',
            synopsis: 'ลูฟี่กับลูกเรือหมวกฟาง ออกเดินทางสำรวจทะเลทั้ง 4 เพื่อตามหาสมบัติในตำนาน One Piece และเป็นราชาโจรสลัด',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1244/138851l.jpg',
            trailer_url: '',
            rating: 8.9,
            status: 'airing',
            year: 1999,
            season: 'fall',
            studio: 'Toei Animation',
            total_episodes: 1100,
            genres: ['action', 'adventure', 'comedy', 'shounen']
        },
        {
            title: 'Chainsaw Man Season 2',
            title_en: 'Chainsaw Man Season 2',
            synopsis: 'เดนจิ หนุ่มน้อยที่หลอมรวมกับปีศาจเลื่อยยนต์ ต้องต่อสู้กับปีศาจที่ทรงพลังมากขึ้นในขณะที่ค้นหาความหมายของชีวิตในโลกที่โหดร้าย',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',
            trailer_url: '',
            rating: 8.4,
            status: 'airing',
            year: 2025,
            season: 'spring',
            studio: 'MAPPA',
            total_episodes: 12,
            genres: ['action', 'supernatural', 'seinen']
        },
        {
            title: 'Spy x Family Season 3',
            title_en: 'Spy x Family Season 3',
            synopsis: 'ครอบครัวฟอร์เจอร์! สายลับ นักฆ่า และเด็กอ่านใจ ต้องรักษาความลับของตัวเองขณะใช้ชีวิตครอบครัวสุดป่วน ภารกิจลับและซีนตลกหัวหลุดเพียบ!',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1441/122795l.jpg',
            trailer_url: '',
            rating: 8.6,
            status: 'airing',
            year: 2025,
            season: 'winter',
            studio: 'WIT Studio',
            total_episodes: 12,
            genres: ['action', 'comedy', 'slice-of-life']
        },
        {
            title: 'Frieren: Beyond Journey\'s End',
            title_en: 'Sousou no Frieren',
            synopsis: 'ฟรีเรน นักเวทย์เอลฟ์ผู้มีอายุพันปี ออกเดินทางหลังจากเพื่อนร่วมทางผู้กล้ามนุษย์เสียชีวิตไปตามอายุขัย เพื่อเรียนรู้ว่า "การเข้าใจมนุษย์" คืออะไร',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
            trailer_url: '',
            rating: 9.3,
            status: 'completed',
            year: 2024,
            season: 'winter',
            studio: 'Madhouse',
            total_episodes: 28,
            genres: ['adventure', 'drama', 'fantasy']
        },
        {
            title: 'Oshi no Ko Season 2',
            title_en: 'My Star Season 2',
            synopsis: 'อควา โอชิโนะโกะ ยังคงตามหาความจริงเบื้องหลังการตายของแม่ ภายใต้แสงสปอตไลท์ของวงการบันเทิงญี่ปุ่นที่มืดมนและซ่อนปมลึก',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1190/142290.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1190/142290l.jpg',
            trailer_url: '',
            rating: 8.2,
            status: 'completed',
            year: 2024,
            season: 'summer',
            studio: 'Doga Kobo',
            total_episodes: 13,
            genres: ['drama', 'mystery', 'supernatural']
        },
        {
            title: 'Mashle: Magic and Muscles',
            title_en: 'Mashle: Magic and Muscles',
            synopsis: 'มาชา ชายหนุ่มที่ไม่มีเวทมนตร์แม้แต่น้อยในโลกที่ทุกคนใช้เวทมนตร์ แต่เขาจะใช้พลังกล้ามเนื้อสุดโหดเพื่อก้าวขึ้นเป็นที่สุด!',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1209/134623.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1209/134623l.jpg',
            trailer_url: '',
            rating: 7.8,
            status: 'completed',
            year: 2024,
            season: 'winter',
            studio: 'A-1 Pictures',
            total_episodes: 12,
            genres: ['action', 'comedy', 'fantasy', 'shounen']
        },
        {
            title: 'Blue Lock Season 2',
            title_en: 'Blue Lock Season 2',
            synopsis: 'โปรเจกต์ Blue Lock เพื่อค้นหาสตรายเกอร์อีโก้อิสต์ที่สุดของญี่ปุ่น การแข่งขันยิ่งเข้มข้น เมื่อนักเตะอีโก้มาเผชิญหน้ากัน!',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1418/117083.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1418/117083l.jpg',
            trailer_url: '',
            rating: 8.1,
            status: 'airing',
            year: 2025,
            season: 'winter',
            studio: '8bit',
            total_episodes: 24,
            genres: ['sports', 'shounen']
        },
        {
            title: 'Dandadan',
            title_en: 'Dandadan',
            synopsis: 'โอกาคุระ โมโมะ สาวที่เชื่อเรื่องผี กับทาคาคุระ เคน หนุ่มที่เชื่อเรื่อง UFO ต้องร่วมมือกันเผชิญหน้ากับภัยเหนือธรรมชาติทั้งผีและเอเลี่ยน!',
            cover_image: 'https://cdn.myanimelist.net/images/anime/1259/143194.jpg',
            banner_image: 'https://cdn.myanimelist.net/images/anime/1259/143194l.jpg',
            trailer_url: '',
            rating: 8.8,
            status: 'airing',
            year: 2025,
            season: 'winter',
            studio: 'Science SARU',
            total_episodes: 12,
            genres: ['action', 'comedy', 'supernatural', 'sci-fi']
        }
    ];

    const animeList = await Anime.insertMany(animeData);
    console.log(`  ✅ ${animeList.length} anime inserted`);

    // --- Sample Episodes (first 5 anime) ---
    const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const episodeData = [];
    for (let i = 0; i < Math.min(5, animeList.length); i++) {
        const epCount = i <= 1 ? 12 : (i === 4 ? 6 : 8);
        for (let ep = 1; ep <= epCount; ep++) {
            episodeData.push({
                anime_id: animeList[i]._id,
                number: ep,
                title: `ตอนที่ ${ep}`,
                thumbnail: '',
                video_url: sampleVideo,
                duration: 1440
            });
        }
    }
    const episodes = await Episode.insertMany(episodeData);
    console.log(`  ✅ ${episodes.length} episodes inserted`);

    // --- Watch history for demo user ---
    await WatchHistory.insertMany([
        { user_id: demoUser._id, episode_id: episodes[0]._id, progress_seconds: 1440, completed: true },
        { user_id: demoUser._id, episode_id: episodes[1]._id, progress_seconds: 1440, completed: true },
        { user_id: demoUser._id, episode_id: episodes[2]._id, progress_seconds: 724, completed: false }
    ]);
    console.log('  ✅ Watch history seeded');

    // --- Watchlist ---
    await Watchlist.insertMany([
        { user_id: demoUser._id, anime_id: animeList[0]._id, status: 'watching' },
        { user_id: demoUser._id, anime_id: animeList[2]._id, status: 'want' },
        { user_id: demoUser._id, anime_id: animeList[3]._id, status: 'completed' },
        { user_id: demoUser._id, anime_id: animeList[7]._id, status: 'want' }
    ]);
    console.log('  ✅ Watchlist seeded');

    // --- Sample comments ---
    await Comment.insertMany([
        { user_id: demoUser._id, episode_id: episodes[0]._id, content: 'ตอนแรกมันมากกกก! 🔥' },
        { user_id: demoUser._id, episode_id: episodes[1]._id, content: 'แอนิเมชั่น MAPPA สุดยอดเหมือนเดิม' },
        { user_id: adminUser._id, episode_id: episodes[0]._id, content: 'ใครยังไม่ดูรีบดูเลย ดีมากเลย' }
    ]);
    console.log('  ✅ Comments seeded');

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
