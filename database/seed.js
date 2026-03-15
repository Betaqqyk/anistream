const { getDbAsync } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    const db = await getDbAsync();

    console.log('🌱 Seeding database...');

    // --- Genres ---
    const genres = [
        { name: 'Action', slug: 'action' },
        { name: 'Adventure', slug: 'adventure' },
        { name: 'Comedy', slug: 'comedy' },
        { name: 'Drama', slug: 'drama' },
        { name: 'Fantasy', slug: 'fantasy' },
        { name: 'Horror', slug: 'horror' },
        { name: 'Mecha', slug: 'mecha' },
        { name: 'Music', slug: 'music' },
        { name: 'Mystery', slug: 'mystery' },
        { name: 'Psychological', slug: 'psychological' },
        { name: 'Romance', slug: 'romance' },
        { name: 'Sci-Fi', slug: 'sci-fi' },
        { name: 'Slice of Life', slug: 'slice-of-life' },
        { name: 'Sports', slug: 'sports' },
        { name: 'Supernatural', slug: 'supernatural' },
        { name: 'Thriller', slug: 'thriller' },
        { name: 'Isekai', slug: 'isekai' },
        { name: 'Shounen', slug: 'shounen' },
        { name: 'Shoujo', slug: 'shoujo' },
        { name: 'Seinen', slug: 'seinen' }
    ];

    const genreStmt = db.prepare('INSERT OR IGNORE INTO genres (name, slug) VALUES (?, ?)');
    genres.forEach(g => genreStmt.run(g.name, g.slug));

    // --- Demo users ---
    const passwordHash = bcrypt.hashSync('demo123', 10);
    const userStmt = db.prepare('INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)');
    userStmt.run('demo', 'demo@anistream.com', passwordHash, 'user');
    userStmt.run('admin', 'admin@anistream.com', bcrypt.hashSync('admin123', 10), 'admin');

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

    const animeStmt = db.prepare(
        `INSERT OR IGNORE INTO anime (title, title_en, synopsis, cover_image, banner_image, trailer_url, rating, status, year, season, studio, total_episodes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const animeGenreStmt = db.prepare('INSERT OR IGNORE INTO anime_genres (anime_id, genre_id) VALUES (?, ?)');
    const findGenre = db.prepare('SELECT id FROM genres WHERE slug = ?');

    animeData.forEach(a => {
        const result = animeStmt.run(
            a.title, a.title_en, a.synopsis, a.cover_image, a.banner_image,
            a.trailer_url, a.rating, a.status, a.year, a.season, a.studio, a.total_episodes
        );
        if (result.changes > 0) {
            const animeId = result.lastInsertRowid;
            a.genres.forEach(slug => {
                const genre = findGenre.get(slug);
                if (genre) animeGenreStmt.run(animeId, genre.id);
            });
        }
    });

    // --- Sample Episodes ---
    const epStmt = db.prepare(
        `INSERT OR IGNORE INTO episodes (anime_id, number, title, thumbnail, video_url, duration)
         VALUES (?, ?, ?, ?, ?, ?)`
    );

    const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    for (let animeId = 1; animeId <= 5; animeId++) {
        const epCount = animeId <= 2 ? 12 : (animeId === 5 ? 6 : 8);
        for (let ep = 1; ep <= epCount; ep++) {
            epStmt.run(
                animeId, ep,
                `ตอนที่ ${ep}`,
                '',
                sampleVideo,
                1440
            );
        }
    }

    // Add some watch history for demo user
    const histStmt = db.prepare(
        `INSERT OR IGNORE INTO watch_history (user_id, episode_id, progress_seconds, completed)
         VALUES (?, ?, ?, ?)`
    );
    histStmt.run(1, 1, 1440, 1);
    histStmt.run(1, 2, 1440, 1);
    histStmt.run(1, 3, 724, 0);

    // Add watchlist entries
    const wlStmt = db.prepare(
        `INSERT OR IGNORE INTO watchlist (user_id, anime_id, status) VALUES (?, ?, ?)`
    );
    wlStmt.run(1, 1, 'watching');
    wlStmt.run(1, 3, 'want');
    wlStmt.run(1, 4, 'completed');
    wlStmt.run(1, 8, 'want');

    // Add sample comments
    const cmtStmt = db.prepare(
        `INSERT OR IGNORE INTO comments (user_id, episode_id, content) VALUES (?, ?, ?)`
    );
    cmtStmt.run(1, 1, 'ตอนแรกมันมากกกก! 🔥');
    cmtStmt.run(1, 2, 'แอนิเมชั่น MAPPA สุดยอดเหมือนเดิม');
    cmtStmt.run(2, 1, 'ใครยังไม่ดูรีบดูเลย ดีมากเลย');

    console.log('✅ Database seeded successfully!');
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
