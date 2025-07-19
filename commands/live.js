const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const footballAPI = require('../utils/football-api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('live')
        .setDescription('المباريات المباشرة'),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const liveMatches = await footballAPI.getLiveMatches();

            const embed = new EmbedBuilder()
                .setTitle('🔴 المباريات المباشرة')
                .setColor(0xff0000);

            if (liveMatches.length > 0) {
                embed.setDescription(`🔴 **${liveMatches.length}** مباراة مباشرة الآن:`);

                liveMatches.slice(0, 5).forEach(match => {
                    const homeTeam = match.homeTeam.name;
                    const awayTeam = match.awayTeam.name;
                    const homeScore = match.score.fullTime.home || match.score.halfTime.home || 0;
                    const awayScore = match.score.fullTime.away || match.score.halfTime.away || 0;
                    const minute = match.minute || '0';
                    const flag = footballAPI.getLeagueFlag(match.competition);

                    embed.addFields({
                        name: `${flag} ${match.competition.name}`,
                        value: `⚽ **${homeTeam} ${homeScore}-${awayScore} ${awayTeam}**\n🕐 الدقيقة ${minute}`,
                        inline: false
                    });
                });

                if (liveMatches.length > 5) {
                    embed.addFields({
                        name: '➕ المزيد',
                        value: `و ${liveMatches.length - 5} مباراة أخرى مباشرة`,
                        inline: false
                    });
                }
            } else {
                embed.setDescription('🕐 لا توجد مباريات مباشرة في الوقت الحالي');
                
                // عرض مباريات اليوم كبديل
                const todayMatches = await footballAPI.getTodayMatches();
                if (todayMatches.length > 0) {
                    const upcomingToday = todayMatches.filter(match => 
                        new Date(match.utcDate) > new Date()
                    ).slice(0, 3);

                    if (upcomingToday.length > 0) {
                        embed.addFields({
                            name: '📅 مباريات اليوم القادمة',
                            value: upcomingToday.map(match => {
                                const time = footballAPI.formatMatchTime(match.utcDate);
                                const flag = footballAPI.getLeagueFlag(match.competition);
                                return `${flag} **${match.homeTeam.name}** 🆚 **${match.awayTeam.name}** - ${time}`;
                            }).join('\n'),
                            inline: false
                        });
                    }
                }
            }

            embed.setFooter({ 
                text: `🔄 آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}` 
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Live matches error:', error);
            await interaction.followUp({
                content: '❌ حدث خطأ في جلب المباريات المباشرة. جرب مرة أخرى.',
                ephemeral: true
            });
        }
    }
};
