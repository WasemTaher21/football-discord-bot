const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');

class Database {
    constructor() {
        this.db = null;
    }

    // تهيئة قاعدة البيانات
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(config.database.path, (err) => {
                if (err) {
                    console.error('خطأ في فتح قاعدة البيانات:', err.message);
                    reject(err);
                } else {
                    console.log('✅ تم الاتصال بقاعدة البيانات SQLite');
                    this.createTables()
                        .then(() => this.populateInitialData())
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    // إنشاء الجداول
    async createTables() {
        const tables = [
            // جدول الفرق المفضلة
            `CREATE TABLE IF NOT EXISTS user_favorites (
                user_id TEXT,
                team_id INTEGER,
                team_name TEXT,
                team_logo TEXT,
                league TEXT,
                added_date TEXT,
                PRIMARY KEY (user_id, team_id)
            )`,

            // جدول اللاعبين المفضلين
            `CREATE TABLE IF NOT EXISTS user_favorite_players (
                user_id TEXT,
                player_id INTEGER,
                player_name TEXT,
                team_name TEXT,
                position TEXT,
                nationality TEXT,
                added_date TEXT,
                PRIMARY KEY (user_id, player_id)
            )`,

            // جدول إعدادات المستخدمين
            `CREATE TABLE IF NOT EXISTS user_settings (
                user_id TEXT PRIMARY KEY,
                show_only_favorites BOOLEAN DEFAULT 1,
                notifications_enabled BOOLEAN DEFAULT 1,
                preferred_language TEXT DEFAULT 'ar',
                timezone TEXT DEFAULT 'UTC+3'
            )`,

            // جدول تنبيهات المباريات
            `CREATE TABLE IF NOT EXISTS match_notifications (
                user_id TEXT,
                team_name TEXT,
                notification_time INTEGER DEFAULT 30,
                enabled BOOLEAN DEFAULT 1,
                PRIMARY KEY (user_id, team_name)
            )`,

            // جدول بيانات الفرق
            `CREATE TABLE IF NOT EXISTS teams_data (
                team_id INTEGER PRIMARY KEY,
                team_name TEXT,
                team_short_name TEXT,
                league TEXT,
                country TEXT,
                logo_url TEXT,
                established_year INTEGER
            )`,

            // جدول بيانات اللاعبين
            `CREATE TABLE IF NOT EXISTS players_data (
                player_id INTEGER PRIMARY KEY,
                player_name TEXT,
                team_name TEXT,
                position TEXT,
                nationality TEXT,
                age INTEGER,
                market_value TEXT,
                jersey_number INTEGER
            )`,

            // جدول القنوات العارضة
            `CREATE TABLE IF NOT EXISTS broadcast_channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                competition TEXT,
                region TEXT,
                channel_name TEXT,
                channel_type TEXT,
                is_free BOOLEAN DEFAULT 0,
                quality TEXT,
                language TEXT
            )`,

            // جدول المعلقين
            `CREATE TABLE IF NOT EXISTS commentators (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                language TEXT,
                channel TEXT,
                speciality TEXT,
                rating REAL DEFAULT 0.0
            )`,

            // جدول إعدادات الخوادم
            `CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                default_league TEXT DEFAULT 'PL',
                timezone TEXT DEFAULT 'UTC',
                language TEXT DEFAULT 'ar'
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
    }

    // ملء البيانات الأولية
    async populateInitialData() {
        // التحقق من وجود البيانات
        const teamsCount = await this.get('SELECT COUNT(*) as count FROM teams_data');
        if (teamsCount.count > 0) return;

        console.log('📊 ملء قاعدة البيانات بالبيانات الأولية...');

        // بيانات الفرق
        const teams = [
            [1, 'Manchester City', 'Man City', 'Premier League', 'England', '', 1880],
            [2, 'Liverpool', 'Liverpool', 'Premier League', 'England', '', 1892],
            [3, 'Manchester United', 'Man Utd', 'Premier League', 'England', '', 1878],
            [4, 'Arsenal', 'Arsenal', 'Premier League', 'England', '', 1886],
            [5, 'Chelsea', 'Chelsea', 'Premier League', 'England', '', 1905],
            [6, 'Tottenham Hotspur', 'Spurs', 'Premier League', 'England', '', 1882],
            [7, 'Newcastle United', 'Newcastle', 'Premier League', 'England', '', 1892],
            [8, 'Real Madrid', 'Real Madrid', 'La Liga', 'Spain', '', 1902],
            [9, 'FC Barcelona', 'Barcelona', 'La Liga', 'Spain', '', 1899],
            [10, 'Atlético Madrid', 'Atlético', 'La Liga', 'Spain', '', 1903],
            [11, 'Sevilla FC', 'Sevilla', 'La Liga', 'Spain', '', 1890],
            [12, 'Valencia CF', 'Valencia', 'La Liga', 'Spain', '', 1919],
            [13, 'Juventus', 'Juventus', 'Serie A', 'Italy', '', 1897],
            [14, 'AC Milan', 'Milan', 'Serie A', 'Italy', '', 1899],
            [15, 'Inter Milan', 'Inter', 'Serie A', 'Italy', '', 1908],
            [16, 'AS Roma', 'Roma', 'Serie A', 'Italy', '', 1927],
            [17, 'Napoli', 'Napoli', 'Serie A', 'Italy', '', 1926],
            [18, 'Bayern Munich', 'Bayern', 'Bundesliga', 'Germany', '', 1900],
            [19, 'Borussia Dortmund', 'Dortmund', 'Bundesliga', 'Germany', '', 1909],
            [20, 'RB Leipzig', 'Leipzig', 'Bundesliga', 'Germany', '', 2009],
            [21, 'Paris Saint-Germain', 'PSG', 'Ligue 1', 'France', '', 1970],
            [22, 'Olympique Marseille', 'Marseille', 'Ligue 1', 'France', '', 1899],
            [23, 'AS Monaco', 'Monaco', 'Ligue 1', 'France', '', 1924],
            [24, 'Al Hilal', 'الهلال', 'Saudi Pro League', 'Saudi Arabia', '', 1957],
            [25, 'Al Nassr', 'النصر', 'Saudi Pro League', 'Saudi Arabia', '', 1955],
            [26, 'Al Ahli', 'الأهلي', 'Saudi Pro League', 'Saudi Arabia', '', 1937],
            [27, 'Al Ittihad', 'الاتحاد', 'Saudi Pro League', 'Saudi Arabia', '', 1927]
        ];

        // بيانات اللاعبين
        const players = [
            [1, 'Cristiano Ronaldo', 'Al Nassr', 'Forward', 'Portugal', 39, '€15M', 7],
            [2, 'Karim Benzema', 'Al Ittihad', 'Forward', 'France', 36, '€20M', 9],
            [3, 'Neymar Jr', 'Al Hilal', 'Forward', 'Brazil', 32, '€60M', 10],
            [4, 'Erling Haaland', 'Manchester City', 'Forward', 'Norway', 24, '€180M', 9],
            [5, 'Kylian Mbappé', 'Real Madrid', 'Forward', 'France', 25, '€180M', 7],
            [6, 'Mohamed Salah', 'Liverpool', 'Forward', 'Egypt', 32, '€65M', 11],
            [7, 'Kevin De Bruyne', 'Manchester City', 'Midfielder', 'Belgium', 33, '€80M', 17],
            [8, 'Virgil van Dijk', 'Liverpool', 'Defender', 'Netherlands', 33, '€40M', 4],
            [9, 'Luka Modrić', 'Real Madrid', 'Midfielder', 'Croatia', 39, '€10M', 10],
            [10, 'Robert Lewandowski', 'FC Barcelona', 'Forward', 'Poland', 35, '€45M', 9],
            [11, 'Sadio Mané', 'Al Nassr', 'Forward', 'Senegal', 32, '€30M', 10],
            [12, 'Riyad Mahrez', 'Al Ahli', 'Forward', 'Algeria', 33, '€25M', 26]
        ];

        // إدراج الفرق
        for (const team of teams) {
            await this.run(`
                INSERT OR REPLACE INTO teams_data 
                (team_id, team_name, team_short_name, league, country, logo_url, established_year)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, team);
        }

        // إدراج اللاعبين
        for (const player of players) {
            await this.run(`
                INSERT OR REPLACE INTO players_data 
                (player_id, player_name, team_name, position, nationality, age, market_value, jersey_number)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, player);
        }

        // إدراج القنوات العربية
        const arabicChannels = config.arabicChannels;
        for (const channel of arabicChannels) {
            await this.run(`
                INSERT INTO broadcast_channels 
                (competition, region, channel_name, channel_type, is_free, quality, language)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Premier League', 'Arab', channel.name, channel.type, channel.free, channel.quality, 'ar']);
        }

        // إدراج القنوات الإنجليزية
        const englishChannels = config.englishChannels;
        for (const channel of englishChannels) {
            await this.run(`
                INSERT INTO broadcast_channels 
                (competition, region, channel_name, channel_type, is_free, quality, language)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, ['Premier League', 'UK', channel.name, channel.type, channel.free, channel.quality, 'en']);
        }

        // إدراج المعلقين العرب
        for (const commentator of config.arabicCommentators) {
            await this.run(`
                INSERT INTO commentators 
                (name, language, channel, speciality, rating)
                VALUES (?, ?, ?, ?, ?)
            `, [commentator.name, 'ar', commentator.channel, 'كرة القدم الأوروبية', commentator.rating]);
        }

        // إدراج المعلقين الإنجليز
        for (const commentator of config.englishCommentators) {
            await this.run(`
                INSERT INTO commentators 
                (name, language, channel, speciality, rating)
                VALUES (?, ?, ?, ?, ?)
            `, [commentator.name, 'en', commentator.channel, 'European Football', commentator.rating]);
        }

        console.log('✅ تم ملء قاعدة البيانات بالبيانات الأولية');
    }

    // تنفيذ استعلام
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // جلب صف واحد
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // جلب صفوف متعددة
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // إغلاق قاعدة البيانات
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('📊 تم إغلاق قاعدة البيانات');
                    resolve();
                }
            });
        });
    }

    // الحصول على الفرق المفضلة للمستخدم
    async getUserFavoriteTeams(userId) {
        return await this.all(`
            SELECT uf.team_name, uf.league, uf.added_date, td.team_short_name, td.country
            FROM user_favorites uf
            LEFT JOIN teams_data td ON uf.team_name = td.team_name
            WHERE uf.user_id = ?
            ORDER BY uf.added_date DESC
        `, [userId]);
    }

    // الحصول على اللاعبين المفضلين للمستخدم
    async getUserFavoritePlayers(userId) {
        return await this.all(`
            SELECT ufp.player_name, ufp.team_name, ufp.position, ufp.nationality, ufp.added_date,
                   pd.age, pd.market_value, pd.jersey_number
            FROM user_favorite_players ufp
            LEFT JOIN players_data pd ON ufp.player_name = pd.player_name
            WHERE ufp.user_id = ?
            ORDER BY ufp.added_date DESC
        `, [userId]);
    }

    // إضافة فريق للمفضلة
    async addFavoriteTeam(userId, teamId, teamName, league) {
        const now = new Date().toISOString().split('T')[0];
        return await this.run(`
            INSERT OR REPLACE INTO user_favorites (user_id, team_id, team_name, league, added_date)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, teamId, teamName, league, now]);
    }

    // إزالة فريق من المفضلة
    async removeFavoriteTeam(userId, teamName) {
        return await this.run(`
            DELETE FROM user_favorites WHERE user_id = ? AND LOWER(team_name) LIKE ?
        `, [userId, `%${teamName.toLowerCase()}%`]);
    }

    // إضافة لاعب للمفضلة
    async addFavoritePlayer(userId, playerId, playerName, teamName, position, nationality) {
        const now = new Date().toISOString().split('T')[0];
        return await this.run(`
            INSERT OR REPLACE INTO user_favorite_players 
            (user_id, player_id, player_name, team_name, position, nationality, added_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, playerId, playerName, teamName, position, nationality, now]);
    }

    // إزالة لاعب من المفضلة
    async removeFavoritePlayer(userId, playerName) {
        return await this.run(`
            DELETE FROM user_favorite_players WHERE user_id = ? AND LOWER(player_name) LIKE ?
        `, [userId, `%${playerName.toLowerCase()}%`]);
    }

    // البحث عن فريق
    async searchTeams(query, limit = 10) {
        return await this.all(`
            SELECT team_id, team_name, team_short_name, league, country, established_year
            FROM teams_data 
            WHERE LOWER(team_name) LIKE ? 
               OR LOWER(team_short_name) LIKE ?
               OR LOWER(league) LIKE ?
               OR LOWER(country) LIKE ?
            ORDER BY 
                CASE 
                    WHEN LOWER(team_name) LIKE ? THEN 1
                    WHEN LOWER(team_short_name) LIKE ? THEN 2
                    WHEN LOWER(league) LIKE ? THEN 3
                    ELSE 4
                END
            LIMIT ?
        `, [
            `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`, 
            `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`,
            `${query.toLowerCase()}%`, `${query.toLowerCase()}%`, 
            `${query.toLowerCase()}%`, limit
        ]);
    }

    // البحث عن لاعب
    async searchPlayers(query, limit = 10) {
        return await this.all(`
            SELECT player_id, player_name, team_name, position, nationality, age, market_value, jersey_number
            FROM players_data 
            WHERE LOWER(player_name) LIKE ?
            ORDER BY 
                CASE WHEN LOWER(player_name) LIKE ? THEN 1 ELSE 2 END
            LIMIT ?
        `, [`%${query.toLowerCase()}%`, `${query.toLowerCase()}%`, limit]);
    }

    // الحصول على إعدادات المستخدم
    async getUserSettings(userId) {
        let settings = await this.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
        
        if (!settings) {
            // إنشاء إعدادات افتراضية
            await this.run(`
                INSERT INTO user_settings (user_id, show_only_favorites, notifications_enabled, preferred_language)
                VALUES (?, 1, 1, 'ar')
            `, [userId]);
            
            settings = await this.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
        }
        
        return settings;
    }

    // تحديث إعدادات المستخدم
    async updateUserSettings(userId, settings) {
        const updates = [];
        const values = [];
        
        if (settings.showOnlyFavorites !== undefined) {
            updates.push('show_only_favorites = ?');
            values.push(settings.showOnlyFavorites);
        }
        
        if (settings.notifications !== undefined) {
            updates.push('notifications_enabled = ?');
            values.push(settings.notifications);
        }
        
        if (settings.language !== undefined) {
            updates.push('preferred_language = ?');
            values.push(settings.language);
        }
        
        if (updates.length > 0) {
            values.push(userId);
            return await this.run(`
                UPDATE user_settings 
                SET ${updates.join(', ')}
                WHERE user_id = ?
            `, values);
        }
    }
}

const database = new Database();

async function initializeDatabase() {
    await database.initialize();
}

module.exports = {
    database,
    initializeDatabase
};