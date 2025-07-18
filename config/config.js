module.exports = {
    // إعدادات البوت الأساسية
    bot: {
        token: process.env.DISCORD_TOKEN,
        prefix: process.env.BOT_PREFIX || '!',
        language: process.env.DEFAULT_LANGUAGE || 'ar'
    },

    // إعدادات API
    api: {
        footballData: {
            url: process.env.FOOTBALL_API_URL || 'https://api.football-data.org/v4',
            key: process.env.SPORTS_API_KEY,
            timeout: 10000
        }
    },

    // إعدادات قاعدة البيانات
    database: {
        path: process.env.DATABASE_PATH || './sports_bot.db'
    },

    // رموز الدوريات
    leagues: {
        'PL': 'Premier League',
        'PD': 'La Liga',
        'SA': 'Serie A',
        'BL1': 'Bundesliga',
        'FL1': 'Ligue 1',
        'CL': 'Champions League',
        'EC': 'European Championship',
        'WC': 'World Cup'
    },

    // ألوان الـ embeds
    colors: {
        primary: 0x0099ff,
        success: 0x00ff00,
        warning: 0xff9900,
        error: 0xff0000,
        info: 0x9966ff,
        match: {
            live: 0xff0000,
            scheduled: 0xff9900,
            finished: 0x00ff00
        }
    },

    // إعدادات المباريات
    matches: {
        maxPerEmbed: 10,
        maxPerDay: 5,
        updateInterval: 120000, // دقيقتان بالميلي ثانية
        defaultDays: 7
    },

    // إعدادات التنبيهات
    notifications: {
        enabled: true,
        defaultTime: 30, // 30 دقيقة قبل المباراة
        dailyTime: '09:00' // التنبيهات اليومية الساعة 9 صباحاً
    },

    // رموز البلدان
    countryFlags: {
        'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'Spain': '🇪🇸',
        'Italy': '🇮🇹',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
        'Saudi Arabia': '🇸🇦',
        'Egypt': '🇪🇬',
        'Portugal': '🇵🇹',
        'Brazil': '🇧🇷',
        'Argentina': '🇦🇷',
        'Netherlands': '🇳🇱',
        'Belgium': '🇧🇪',
        'Croatia': '🇭🇷',
        'Poland': '🇵🇱',
        'Senegal': '🇸🇳',
        'Algeria': '🇩🇿',
        'Morocco': '🇲🇦',
        'default': '🌍'
    },

    // رموز حالة المباراة
    matchStatus: {
        'SCHEDULED': { emoji: '⏳', text: 'مجدولة' },
        'LIVE': { emoji: '🔴', text: 'مباشر' },
        'IN_PLAY': { emoji: '⚽', text: 'جارية' },
        'PAUSED': { emoji: '⏸️', text: 'متوقفة' },
        'FINISHED': { emoji: '✅', text: 'انتهت' },
        'POSTPONED': { emoji: '📅', text: 'مؤجلة' },
        'CANCELLED': { emoji: '❌', text: 'ملغاة' },
        'AWARDED': { emoji: '🏆', text: 'محسومة' }
    },

    // رموز المراكز
    positions: {
        'Forward': { emoji: '⚽', arabic: 'مهاجم' },
        'Midfielder': { emoji: '🎯', arabic: 'وسط' },
        'Defender': { emoji: '🛡️', arabic: 'مدافع' },
        'Goalkeeper': { emoji: '🥅', arabic: 'حارس مرمى' }
    },

    // قنوات البث العربية
    arabicChannels: [
        { name: 'beIN Sports 1 HD', type: 'Premium', free: false, quality: '4K/HD' },
        { name: 'beIN Sports 2 HD', type: 'Premium', free: false, quality: '4K/HD' },
        { name: 'beIN Sports 3 HD', type: 'Premium', free: false, quality: 'HD' },
        { name: 'beIN Sports 4 HD', type: 'Premium', free: false, quality: 'HD' },
        { name: 'beIN Sports 5 HD', type: 'Premium', free: false, quality: 'HD' },
        { name: 'SSC Sport 1', type: 'Premium', free: false, quality: 'HD' },
        { name: 'SSC Sport 2', type: 'Premium', free: false, quality: 'HD' },
        { name: 'الكأس 1', type: 'Free', free: true, quality: 'HD' },
        { name: 'الكأس 2', type: 'Free', free: true, quality: 'HD' },
        { name: 'Shahid VIP', type: 'Streaming', free: false, quality: '4K' }
    ],

    // قنوات البث الإنجليزية
    englishChannels: [
        { name: 'Sky Sports Premier League', type: 'Premium', free: false, quality: '4K/HD' },
        { name: 'Sky Sports Main Event', type: 'Premium', free: false, quality: '4K/HD' },
        { name: 'BT Sport 1', type: 'Premium', free: false, quality: '4K/HD' },
        { name: 'BT Sport 2', type: 'Premium', free: false, quality: 'HD' },
        { name: 'Amazon Prime Video', type: 'Streaming', free: false, quality: '4K' },
        { name: 'NBC Sports', type: 'Premium', free: false, quality: '4K/HD' },
        { name: 'Peacock Premium', type: 'Streaming', free: false, quality: '4K' },
        { name: 'CBS Sports', type: 'Premium', free: false, quality: 'HD' },
        { name: 'Paramount+', type: 'Streaming', free: false, quality: '4K' }
    ],

    // المعلقين العرب
    arabicCommentators: [
        { name: 'عصام الشوالي', channel: 'beIN Sports', rating: 9.5 },
        { name: 'حفيظ دراجي', channel: 'beIN Sports', rating: 9.3 },
        { name: 'علي محمد علي', channel: 'beIN Sports', rating: 9.2 },
        { name: 'فارس عوض', channel: 'beIN Sports', rating: 9.0 },
        { name: 'رؤوف خليف', channel: 'beIN Sports', rating: 8.8 },
        { name: 'صلاح الملك', channel: 'SSC', rating: 8.5 },
        { name: 'محمد الكعبي', channel: 'SSC', rating: 8.7 },
        { name: 'أيمن جاده', channel: 'beIN Sports', rating: 9.4 },
        { name: 'حسام أبو زيد', channel: 'beIN Sports', rating: 9.1 }
    ],

    // المعلقين الإنجليز
    englishCommentators: [
        { name: 'Martin Tyler', channel: 'Sky Sports', rating: 9.6 },
        { name: 'Gary Neville', channel: 'Sky Sports', rating: 9.2 },
        { name: 'Jamie Carragher', channel: 'Sky Sports', rating: 9.0 },
        { name: 'Peter Drury', channel: 'BT Sport', rating: 9.7 },
        { name: 'Darren Fletcher', channel: 'BT Sport', rating: 8.8 },
        { name: 'Arlo White', channel: 'NBC Sports', rating: 8.9 },
        { name: 'Rebecca Lowe', channel: 'NBC Sports', rating: 8.7 },
        { name: 'Jim Beglin', channel: 'BT Sport', rating: 8.6 },
        { name: 'Gary Lineker', channel: 'BBC', rating: 9.3 },
        { name: 'Alan Shearer', channel: 'BBC', rating: 8.9 }
    ]
};