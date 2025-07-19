const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const footballAPI = require('../utils/football-api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upcoming')
        .setDescription('المباريات القادمة')
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('عدد الأيام (1-14)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(14)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const days = interaction.options.getInteger('days') || 7;
            const upcomingMatches = await footballAPI.getUpcomingMatches(days);

            const embed = new EmbedBuilder()
                .setTitle('📅 المباريات القادمة')
                .setDescription(`المباريات في الـ ${days} أيام القادمة:`)
                .setColor(0x00ff99);

            if (upcomingMatches.length > 0) {
                // تجميع المباريات حسب التاريخ
                const matchesByDate = {};
                
                upcomingMatches.forEach(match => {
                    const matchDate = footballAPI.formatMatchDate(match.utcDate);
                    if (!matchesByDate[matchDate]) {
                        matchesByDate[matchDate] = [];
                    }
                    matchesByDate[matchDate].push(match);
                });

                // عرض أول 3 أيام
                Object.entries(matchesByDate).slice(0, 3).forEach(([date, matches]) => {
                    const dayMatches = matches.slice(0, 4).map(match => {
                        const time = footballAPI.formatMatchTime(match.utcDate);
                        const flag = footballAPI.getLeagueFlag(match.competition);
                        return `${flag} **${match.homeTeam.name}** 🆚 **${match.awayTeam.name}** - ${time}`;
                    }).join('\n');

                    embed.addFields({
                        name: `🗓️ ${date}`,
                        value: dayMatches + (matches.length > 4 ? `\n... و ${matches.length - 4} مباراة أخرى` : ''),
                        inline: false
                    });
                });

                // إحصائيات عامة
                const totalMatches = upcomingMatches.length;
                const leagues = [...new Set(upcomingMatches.map(m => m.competition.name))];
                
                embed.addFields({
                    name: '📊 ملخص',
                    value: `📈 **${totalMatches}** مباراة في **${days}** أيام\n🏆 **${leagues.length}** دوري مختلف\n🔄 محدث كل ساعة`,
                    inline: false
                });

            } else {
                embed.setDescription(`🤔 لا توجد مباريات مجدولة في الـ ${days} أيام القادمة`);
                embed.addFields({
                    name: '💡 اقتراح',
                    value: 'جرب زيادة عدد الأيام أو استخدم `/upcoming days:14`',
                    inline: false
                });
            }

            embed.setFooter({ text: `📅 بيانات حقيقية • آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}` });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Upcoming matches error:', error);
            await interaction.followUp({
                content: '❌ حدث خطأ في جلب المباريات القادمة. جرب مرة أخرى.',
                ephemeral: true
            });
        }
    }
};
