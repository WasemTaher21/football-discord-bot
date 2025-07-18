const axios = require('axios');
const config = require('../config/config');
const { database } = require('../database/database');

class HelperUtils {
    // تنفيذ طلب API
    static async makeAPIRequest(endpoint) {
        try {
            const response = await axios.get(`${config.api.footballData.url}${endpoint}`, {
                headers: {
                    'X-Auth-Token': config.api.footballData.key,
                    'Content-Type': 'application/json'
                },
                timeout: config.api.footballData.timeout
            });
            
            return response.data;
        } catch (error) {
            console.error('API Request Error:', error.message);
            return { error: error.message };
        }
    }

    // الحصول على المباريات المباشرة
    static async getLiveMatches() {
        const today = this.getTodayDate();
        const data = await this.makeAPIRequest(`/matches?dateFrom=${today}&dateTo=${today}`);
        
        if (data.error) return [];
        
        return data.matches?.filter(match => match.status === 'IN_PLAY' || match.status === 'LIVE') || [];
    }

    // فلترة المباريات حسب الفرق المفضلة
    static async filterMatchesByFavorites(matches, userId) {
        const favoriteTeams = await database.getUserFavoriteTeams(userId);
        
        if (!favoriteTeams || favoriteTeams.length === 0) {
            return matches;
        }
        
        const favoriteNames = favoriteTeams.map(team => team.team_name.toLowerCase());
        const favoriteShortNames = favoriteTeams.map(team => team.team_short_name?.toLowerCase()).filter(Boolean);
        const allFavoriteNames = [...favoriteNames, ...favoriteShortNames];
        
        return matches.filter(match => {
            const homeTeam = match.homeTeam.name.toLowerCase();
            const awayTeam = match.awayTeam.name.toLowerCase();
            
            return allFavoriteNames.some(favName => 
                homeTeam.includes(favName) || awayTeam.includes(favName)
            );
        });
    }

    // التحقق من إعدادات المستخدم
    static async shouldShowOnlyFavorites(userId) {
        const settings = await database.getUserSettings(userId);
        return settings?.show_only_favorites ?? true;
    }

    // الحصول على تاريخ اليوم بصيغة YYYY-MM-DD
    static getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    // الحصول على تاريخ الغد
    static getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // الحصول على تاريخ بعد عدد من الأيام
    static getDateAfterDays(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    // الحصول على معلومات البث للمباراة
    static async getBroadcastInfo(competition) {
        try {
            // القنوات العربية
            const arabicChannels = await database.all(`
                SELECT channel_name, channel_type, is_free, quality, language, region
                FROM broadcast_channels 
                WHERE (competition = ? OR competition LIKE ?) AND language = 'ar'
                ORDER BY is_free DESC, quality DESC
                LIMIT 3
            `, [competition, `%${competition}%`]);

            // القنوات الإنجليزية
            const englishChannels = await database.all(`
                SELECT channel_name, channel_type, is_free, quality, language, region
                FROM broadcast_channels 
                WHERE (competition = ? OR competition LIKE ?) AND language = 'en'
                ORDER BY is_free DESC, quality DESC
                LIMIT 3
            `, [competition, `%${competition}%`]);

            // المعلقين العرب
            const arabicCommentators = await database.all(`
                SELECT name, language, channel, speciality, rating
                FROM commentators 
                WHERE (speciality LIKE ? OR speciality LIKE ?) AND language = 'ar'
                ORDER BY rating DESC
                LIMIT 2
            `, [`%${competition}%`, '%كرة القدم%']);

            // المعلقين الإنجليز
            const englishCommentators = await database.all(`
                SELECT name, language, channel, speciality, rating
                FROM commentators 
                WHERE (speciality LIKE ? OR speciality LIKE ?) AND language = 'en'
                ORDER BY rating DESC
                LIMIT 2
            `, [`%${competition}%`, '%Football%']);

            return {
                arabicChannels,
                englishChannels,
                arabicCommentators,
                englishCommentators
            };
        } catch (error) {
            console.error('Error getting broadcast info:', error);
            return {};
        }
    }

    // تجميع المباريات حسب البطولة
    static groupMatchesByCompetition(matches) {
        const grouped = {};
        
        for (const match of matches) {
            const competition = match.competition.name;
            if (!grouped[competition]) {
                grouped[competition] = [];
            }
            grouped[competition].push(match);
        }
        
        return grouped;
    }

    // تجميع المباريات حسب التاريخ
    static groupMatchesByDate(matches) {
        const grouped = {};
        
        for (const match of matches) {
            const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
            if (!grouped[matchDate]) {
                grouped[matchDate] = [];
            }
            grouped[matchDate].push(match);
        }
        
        return grouped;
    }

    // الحصول على حالة المباراة مع الرمز
    static getMatchStatusDisplay(status) {
        const statusInfo = config.matchStatus[status];
        if (statusInfo) {
            return `${statusInfo.emoji} ${statusInfo.text}`;
        }
        return `❓ ${status}`;
    }

    // الحصول على علم البلد
    static getCountryFlag(country) {
        return config.countryFlags[country] || config.countryFlags.default;
    }

    // تنسيق النتيجة
    static formatScore(match) {
        if (match.score.fullTime.home !== null) {
            return `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
        } else if (match.status === 'IN_PLAY' || match.status === 'LIVE') {
            const home = match.score.fullTime.home || 0;
            const away = match.score.fullTime.away || 0;
            return `${home} - ${away}`;
        }
        return 'لم تبدأ بعد';
    }

    // تنسيق التوقيت
    static formatMatchTime(match) {
        const matchDate = new Date(match.utcDate);
        const timestamp = Math.floor(matchDate.getTime() / 1000);
        
        if (match.status === 'SCHEDULED') {
            return `<t:${timestamp}:t>`;
        } else if (match.status === 'FINISHED') {
            return `انتهت`;
        } else if (match.status === 'IN_PLAY' || match.status === 'LIVE') {
            return `🔴 مباشر`;
        }
        
        return `<t:${timestamp}:R>`;
    }

    // البحث عن الفرق بالاسم
    static async searchTeamsByName(query, limit = 5) {
        return await database.searchTeams(query, limit);
    }

    // البحث عن اللاعبين بالاسم
    static async searchPlayersByName(query, limit = 5) {
        return await database.searchPlayers(query, limit);
    }

    // الحصول على مباريات فريق معين
    static async getTeamMatches(teamName, days = 30) {
        const today = this.getTodayDate();
        const endDate = this.getDateAfterDays(days);
        
        const data = await this.makeAPIRequest(`/matches?dateFrom=${today}&dateTo=${endDate}`);
        
        if (data.error) return [];
        
        const matches = data.matches || [];
        
        return matches.filter(match => {
            const homeTeam = match.homeTeam.name.toLowerCase();
            const awayTeam = match.awayTeam.name.toLowerCase();
            
            return homeTeam.includes(teamName.toLowerCase()) || 
                   awayTeam.includes(teamName.toLowerCase());
        });
    }

    // الحصول على ترتيب الدوري
    static async getLeagueStandings(leagueCode) {
        const data = await this.makeAPIRequest(`/competitions/${leagueCode}/standings`);
        
        if (data.error) return null;
        
        return data.standings?.[0]?.table || [];
    }

    // التحقق من وجود فريق في المفضلة
    static async isTeamInFavorites(userId, teamName) {
        const favoriteTeam = await database.get(`
            SELECT 1 FROM user_favorites 
            WHERE user_id = ? AND LOWER(team_name) LIKE ?
        `, [userId, `%${teamName.toLowerCase()}%`]);
        
        return !!favoriteTeam;
    }

    // التحقق من وجود لاعب في المفضلة
    static async isPlayerInFavorites(userId, playerName) {
        const favoritePlayer = await database.get(`
            SELECT 1 FROM user_favorite_players 
            WHERE user_id = ? AND LOWER(player_name) LIKE ?
        `, [userId, `%${playerName.toLowerCase()}%`]);
        
        return !!favoritePlayer;
    }

    // حساب إحصائيات المستخدم
    static async calculateUserStats(userId) {
        try {
            // عدد الفرق المفضلة
            const favoriteTeamsCount = await database.get(
                'SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ?', 
                [userId]
            );

            // عدد اللاعبين المفضلين
            const favoritePlayersCount = await database.get(
                'SELECT COUNT(*) as count FROM user_favorite_players WHERE user_id = ?', 
                [userId]
            );

            // الفرق حسب الدوري
            const leaguesDistribution = await database.all(`
                SELECT league, COUNT(*) as count 
                FROM user_favorites 
                WHERE user_id = ? 
                GROUP BY league
            `, [userId]);

            // اللاعبين حسب المركز
            const positionsDistribution = await database.all(`
                SELECT position, COUNT(*) as count 
                FROM user_favorite_players 
                WHERE user_id = ? 
                GROUP BY position
            `, [userId]);

            // تاريخ انضمام أول فريق
            const firstTeamDate = await database.get(`
                SELECT MIN(added_date) as first_date 
                FROM user_favorites 
                WHERE user_id = ?
            `, [userId]);

            return {
                favoriteTeamsCount: favoriteTeamsCount?.count || 0,
                favoritePlayersCount: favoritePlayersCount?.count || 0,
                leaguesDistribution: leaguesDistribution || [],
                positionsDistribution: positionsDistribution || [],
                firstTeamDate: firstTeamDate?.first_date,
                totalFavorites: (favoriteTeamsCount?.count || 0) + (favoritePlayersCount?.count || 0)
            };
        } catch (error) {
            console.error('Error calculating user stats:', error);
            return {
                favoriteTeamsCount: 0,
                favoritePlayersCount: 0,
                leaguesDistribution: [],
                positionsDistribution: [],
                firstTeamDate: null,
                totalFavorites: 0
            };
        }
    }

    // التحقق من صحة رمز الدوري
    static isValidLeagueCode(code) {
        return Object.keys(config.leagues).includes(code.toUpperCase());
    }

    // الحصول على اسم الدوري من الرمز
    static getLeagueName(code) {
        return config.leagues[code.toUpperCase()] || code;
    }

    // تحديد نوع القناة
    static getChannelTypeIcon(channelType, isFree) {
        if (isFree) return '🆓';
        if (channelType === 'Streaming') return '📱';
        if (channelType === 'Premium') return '💰';
        return '📺';
    }

    // تحديد رمز الجودة
    static getQualityIcon(quality) {
        if (quality.includes('4K')) return '📺✨';
        if (quality.includes('HD')) return '📺';
        return '📱';
    }

    // تقييم اللاعب/المستخدم بناءً على عدد المفضلة
    static getUserLevel(totalFavorites) {
        if (totalFavorites === 0) {
            return { level: '🌱 مبتدئ', advice: 'ابدأ بإضافة فرقك المفضلة!' };
        } else if (totalFavorites < 5) {
            return { level: '⚡ متحمس', advice: 'أضف المزيد من الفرق واللاعبين!' };
        } else if (totalFavorites < 10) {
            return { level: '🔥 متابع نشط', advice: 'أنت في الطريق الصحيح!' };
        } else if (totalFavorites < 20) {
            return { level: '🏆 خبير كرة', advice: 'معرفة رائعة بالكرة!' };
        } else {
            return { level: '👑 أسطورة', advice: 'أنت حقاً عاشق للكرة!' };
        }
    }

    // تنظيف اسم الفريق لمقارنة أفضل
    static normalizeTeamName(teamName) {
        return teamName.toLowerCase()
            .replace(/fc |cf |ac |sc /g, '')
            .replace(/football club|club de foot/g, '')
            .trim();
    }

    // التحقق من تطابق أسماء الفرق
    static isTeamMatch(team1, team2) {
        const normalized1 = this.normalizeTeamName(team1);
        const normalized2 = this.normalizeTeamName(team2);
        
        return normalized1.includes(normalized2) || normalized2.includes(normalized1);
    }

    // توليد ID عشوائي للمباراة (للتجارب)
    static generateMatchId() {
        return Math.floor(Math.random() * 1000000);
    }

    // تحويل الثواني إلى تنسيق mm:ss
    static formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // إنشاء رسالة خطأ مخصصة
    static createErrorMessage(type, details = '') {
        const errorMessages = {
            'api_error': '❌ خطأ في جلب البيانات من API',
            'db_error': '❌ خطأ في قاعدة البيانات',
            'not_found': '❌ لم يتم العثور على النتائج المطلوبة',
            'invalid_input': '❌ مدخلات غير صحيحة',
            'permission_denied': '❌ ليس لديك صلاحية لهذا الأمر'
        };
        
        const baseMessage = errorMessages[type] || '❌ حدث خطأ غير متوقع';
        return details ? `${baseMessage}: ${details}` : baseMessage;
    }

    // تقسيم المصفوفة إلى مجموعات
    static chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    // إزالة الرموز الخاصة من النص
    static sanitizeText(text) {
        return text.replace(/[^\w\s\u0600-\u06FF]/g, '').trim();
    }

    // التحقق من صحة URL
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // تحويل النص العربي إلى إنجليزي للبحث
    static transliterate(text) {
        const arabicToEnglish = {
            'الهلال': 'Al Hilal',
            'النصر': 'Al Nassr',
            'الأهلي': 'Al Ahli',
            'الاتحاد': 'Al Ittihad',
            'ريال مدريد': 'Real Madrid',
            'برشلونة': 'Barcelona'
        };
        
        return arabicToEnglish[text] || text;
    }
}

module.exports = HelperUtils;