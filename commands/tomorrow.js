const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const footballAPI = require('../utils/football-api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tomorrow')
        .setDescription('مباريات الغد'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const tomorrowMatches = await footballAPI.getTomorrowMatches();

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = footballAPI.formatMatchDate(tomorrow.toISOString());

            const embed = new EmbedBuilder()
                .setTitle('📅 مباريات الغد')
                .setDescription(`**${tomorrowDate}**`)
                .setColor(0x0099ff);

            if (tomorrowMatches.length > 0) {
                // تجميع المباريات حسب الدوري
                const matchesByLeague = {};
                
                tomorrowMatches.forEach(match => {
                    const leagueName = match.competition.name;
                    if (!matchesByLeague[leagueName]) {
                        matchesByLeague[leagueName] = [];
                    }
                    matchesByLeague[leagueName].push(match);
                });

                // عرض كل دوري منفصل
                Object.entries(matchesByLeague).slice(0, 4).forEach(([league, matches]) => {
                    const flag = footballAPI.getLeagueFlag(matches[0].competition);
                    const matchesText = matches.slice(0, 3).map(match => {
                        const time = footballAPI.formatMatchTime(match.utcDate);
                        return `🕐 **${time}** - **${match.homeTeam.name}** 🆚 **${match.awayTeam.name}**`;
                    }).join('\n');

                    embed.addFields({
                        name: `${flag} ${league}`,
                        value: matchesText + (matches.length > 3 ? `\n... و ${matches.length - 3} مباراة أخرى` : ''),
                        inline: false
                    });
                });

                embed.addFields({
                    name: '📊 إحصائيات',
                    value: `📈 **إجمالي المباريات:** ${tomorrowMatches.length}\n🏆 **الدوريات:** ${Object.keys(matchesByLeague).length}`,
                    inline: false
                });

            } else {
                embed.setDescription(`**${tomorrowDate}**\n\n🤔 لا توجد مباريات مجدولة للغد`);
                embed.addFields({
                    name: '💡 اقتراح',
                    value: 'استخدم `/upcoming days:3` لمعرفة المباريات في الأيام القادمة',
                    inline: false
                });
            }

            embed.setFooter({ text: '📅 بيانات حقيقية من Football-Data.org' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Tomorrow matches error:', error);
            await interaction.followUp({
                content: '❌ حدث خطأ في جلب مباريات الغد. جرب مرة أخرى.',
                ephemeral: true
            });
        }
    }
};
