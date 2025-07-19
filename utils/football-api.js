const axios = require('axios');

class FootballAPI {
    constructor() {
        this.baseURL = 'https://api.football-data.org/v4';
        this.apiKey = process.env.FOOTBALL_API_KEY;
        this.headers = {
            'X-Auth-Token': this.apiKey
        };
    }

    // المباريات المباشرة
    async getLiveMatches() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get(`${this.baseURL}/matches`, {
                headers: this.headers,
                params: {
                    dateFrom: today,
                    dateTo: today,
                    status: 'IN_PLAY'
                }
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching live matches:', error);
            return [];
        }
    }

    // مباريات اليوم
    async getTodayMatches() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get(`${this.baseURL}/matches`, {
                headers: this.headers,
                params: {
                    dateFrom: today,
                    dateTo: today
                }
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching today matches:', error);
            return [];
        }
    }

    // مباريات الغد
    async getTomorrowMatches() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0];
            
            const response = await axios.get(`${this.baseURL}/matches`, {
                headers: this.headers,
                params: {
                    dateFrom: tomorrowDate,
                    dateTo: tomorrowDate
                }
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching tomorrow matches:', error);
            return [];
        }
    }

    // المباريات القادمة
    async getUpcomingMatches(days = 7) {
        try {
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + days);
            
            const response = await axios.get(`${this.baseURL}/matches`, {
                headers: this.headers,
                params: {
                    dateFrom: today.toISOString().split('T')[0],
                    dateTo: endDate.toISOString().split('T')[0]
                }
            });
            return response.data.matches;
        } catch (error) {
            console.error('Error fetching upcoming matches:', error);
            return [];
        }
    }

    // تنسيق الوقت
    formatMatchTime(utcDate) {
        const date = new Date(utcDate);
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // تنسيق التاريخ
    formatMatchDate(utcDate) {
        const date = new Date(utcDate);
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    }

    // الحصول على علم الدولة
    getLeagueFlag(competition) {
        const flags = {
            'Premier League': '🇬🇧',
            'La Liga': '🇪🇸',
            'Serie A': '🇮🇹',
            'Bundesliga': '🇩🇪',
            'Ligue 1': '🇫🇷',
            'Eredivisie': '🇳🇱',
            'Primeira Liga': '🇵🇹',
            'Championship': '🇬🇧',
            'Copa Libertadores': '🏆',
            'Champions League': '🏆'
        };
        return flags[competition.name] || '⚽';
    }
}

module.exports = new FootballAPI();
