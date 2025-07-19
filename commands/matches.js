const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const footballAPI = require('../utils/football-api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('matches')
        .setDescription('مباريات اليوم')
        .addBooleanOption(option =>
            option.setName('show_all')
                .setDescription('عرض جميع المباريات أم المفضلة فقط')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('league')
                .setDescription('تصفية حسب دوري معين')
                .setRequired(false)
                .addChoices(
                    { name: '🇬🇧 الدوري الإنجليزي', value: 'PL' },
                    { name: '🇪🇸 الدوري الإسباني', value: 'PD' },
                    { name: '🇮🇹 الدوري الإيطالي', value: 'SA' },
                    { name: '🇩🇪 الدوري الألماني', value: 'BL1' },
                    { name: '🇫🇷 الدوري الفرنسي', value: 'FL1' },
                    { name: '🇳🇱 الدوري الهولندي', value: 'DED' },
                    { name: '🇵🇹 الدوري البرتغالي', value: 'PPL' },
                    { name: '🏆 دوري الأبطال', value: 'CL' },
                    { name: '🌍 الدوري الأوروبي', value: 'EL' },
                    { name: '🇸🇦 الدوري السعودي', value: 'SPL' },
                    { name: '🇪🇬 الدوري المصري', value: 'EGY' },
                    { name: '🇱🇾 الدوري الليبي', value: 'LBY' }
                )),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const showAll = interaction.options.getBoolean('show_all') ?? false;
            const selectedLeague = interaction.options.getString('league');

            // جلب جميع المباريات (أوروبية + عربية)
            let todayMatches = await footballAPI.getAllTodayMatches(true);

            // تصفية حسب الدوري إذا تم اختياره
            if (selectedLeague) {
                // للدوريات العربية
                if (['SPL', 'EGY', 'LBY'].includes(selectedLeague)) {
                    todayMatches = todayMatches.filter(match => 
                        match.competition.code === selectedLeague
                    );
                } else {
                    // للدوريات الأوروبية
                    todayMatches = todayMatches.filter(match => 
                        match.competition.code === selectedLeague
                    );
                }
            }

            const today = new Date().toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const embed = new EmbedBuilder()
                .setTitle('⚽ مباريات اليوم')
                .setDescription(`**${today}**`)
                .setColor(0x00ff00);

            if (todayMatches.length > 0) {
                // تجميع المباريات حسب الحالة
                const liveMatches = todayMatches.filter(match => match.status === 'IN_PLAY');
                const finishedMatches = todayMatches.filter(match => match.status === 'FINISHED');
                const upcomingMatches = todayMatches.filter(match => 
                    match.status === 'SCHEDULED' || match.status === 'TIMED'
                );

                // المباريات المباشرة (أولوية للدوريات العربية)
                if (liveMatches.length > 0) {
                    const arabLiveMatches = liveMatches.filter(m => 
                        ['SPL', 'EGY', 'LBY'].includes(m.competition.code)
                    );
                    const otherLiveMatches = liveMatches.filter(m => 
                        !['SPL', 'EGY', 'LBY'].includes(m.competition.code)
                    );

                    const displayMatches = [...arabLiveMatches, ...otherLiveMatches];

                    const liveText = displayMatches.slice(0, 4).map(match => {
                        const homeScore = match.score.fullTime.home ?? match.score.halfTime.home ?? 0;
                        const awayScore = match.score.fullTime.away ?? match.score.halfTime.away ?? 0;
                        const minute = match.minute || '0';
                        const flag = footballAPI.getLeagueFlag(match.competition);
                        
                        return `${flag} **${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name}** (${minute}')`;
                    }).join('\n');

                    embed.addFields({
                        name: '🔴 مباريات مباشرة الآن',
                        value: liveText + (liveMatches.length > 4 ? `\n... و ${liveMatches.length - 4} مباراة أخرى` : ''),
                        inline: false
                    });
                }

                // المباريات القادمة اليوم (أولوية للدوريات العربية)
                if (upcomingMatches.length > 0) {
                    // فصل الدوريات العربية والأوروبية
                    const arabMatches = upcomingMatches.filter(m => 
                        ['SPL', 'EGY', 'LBY'].includes(m.competition.code)
                    );
                    const otherMatches = upcomingMatches.filter(m => 
                        !['SPL', 'EGY', 'LBY'].includes(m.competition.code)
                    );

                    // عرض الدوريات العربية أولاً
                    if (arabMatches.length > 0) {
                        const arabMatchesByLeague = {};
                        arabMatches.forEach(match => {
                            const leagueName = match.competition.name;
                            if (!arabMatchesByLeague[leagueName]) {
                                arabMatchesByLeague[leagueName] = [];
                            }
                            arabMatchesByLeague[leagueName].push(match);
                        });

                        Object.entries(arabMatchesByLeague).forEach(([league, matches]) => {
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
                    }

                    // عرض الدوريات الأوروبية
                    if (otherMatches.length > 0 && !selectedLeague) {
                        const otherMatchesByLeague = {};
                        otherMatches.forEach(match => {
                            const leagueName = match.competition.name;
                            if (!otherMatchesByLeague[leagueName]) {
                                otherMatchesByLeague[leagueName] = [];
                            }
                            otherMatchesByLeague[leagueName].push(match);
                        });

                        Object.entries(otherMatchesByLeague).slice(0, 2).forEach(([league, matches]) => {
                            const flag = footballAPI.getLeagueFlag(matches[0].competition);
                            const matchesText = matches.slice(0, 2).map(match => {
                                const time = footballAPI.formatMatchTime(match.utcDate);
                                return `🕐 **${time}** - **${match.homeTeam.name}** 🆚 **${match.awayTeam.name}**`;
                            }).join('\n');

                            embed.addFields({
                                name: `${flag} ${league}`,
                                value: matchesText + (matches.length > 2 ? `\n... و ${matches.length - 2} مباراة أخرى` : ''),
                                inline: false
                            });
                        });
                    }
                }

                // المباريات المنتهية (أولوية للعربية)
                if (finishedMatches.length > 0) {
                    const arabFinished = finishedMatches.filter(m => 
                        ['SPL', 'EGY', 'LBY'].includes(m.competition.code)
                    );
                    const otherFinished = finishedMatches.filter(m => 
                        !['SPL', 'EGY', 'LBY'].includes(m.competition.code)
                    );

                    const displayFinished = [...arabFinished, ...otherFinished];

                    const finishedText = displayFinished.slice(0, 4).map(match => {
                        const homeScore = match.score.fullTime.home;
                        const awayScore = match.score.fullTime.away;
                        const flag = footballAPI.getLeagueFlag(match.competition);
                        
                        return `${flag} **${match.homeTeam.name} ${homeScore}-${awayScore} ${match.awayTeam.name}** ✅`;
                    }).join('\n');

                    embed.addFields({
                        name: '✅ نتائج اليوم',
                        value: finishedText + (finishedMatches.length > 4 ? `\n... و ${finishedMatches.length - 4} نتيجة أخرى` : ''),
                        inline: false
                    });
                }

                // إحصائيات اليوم
                const totalMatches = todayMatches.length;
                const arabMatchesCount = todayMatches.filter(m => 
                    ['SPL', 'EGY', 'LBY'].includes(m.competition.code)
                ).length;
                const leagues = [...new Set(todayMatches.map(m => m.competition.name))].length;
                
                embed.addFields({
                    name: '📊 إحصائيات اليوم',
                    value: `📈 **${totalMatches}** مباراة إجمالي\n🏆 **${leagues}** دوري مختلف\n🌍 **${arabMatchesCount}** مباراة عربية\n🔴 **${liveMatches.length}** مباشرة\n⏰ **${upcomingMatches.length}** قادمة\n✅ **${finishedMatches.length}** منتهية`,
                    inline: false
                });

                // نصائح للمستخدم
                if (!showAll && !selectedLeague) {
                    embed.addFields({
                        name: '💡 نصائح',
                        value: '• `/matches league:🇸🇦 الدوري السعودي` - الدوري السعودي فقط\n• `/matches league:🇪🇬 الدوري المصري` - الدوري المصري فقط\n• `/matches league:🇱🇾 الدوري الليبي` - الدوري الليبي فقط\n• `/matches show_all:True` - جميع المباريات',
                        inline: false
                    });
                }

            } else {
                embed.setDescription(`**${today}**\n\n🤔 لا توجد مباريات مجدولة اليوم في هذا الدوري`);
                
                embed.addFields({
                    name: '🌍 جرب الدوريات العربية',
                    value: '• `/matches league:🇸🇦 الدوري السعودي`\n• `/matches league:🇪🇬 الدوري المصري`\n• `/matches league:🇱🇾 الدوري الليبي`',
                    inline: false
                });
            }

            // معلومات الفوتر
            const filterInfo = selectedLeague ? ` • ${selectedLeague}` : '';
            const showAllInfo = showAll ? ' • جميع المباريات' : ' • المباريات المميزة';
            
            embed.setFooter({ 
                text: `📅 بيانات أوروبية حقيقية + عربية محاكاة${showAllInfo}${filterInfo}` 
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Matches error:', error);
            await interaction.followUp({
                content: '❌ حدث خطأ في جلب مباريات اليوم. جرب مرة أخرى.',
                ephemeral: true
            });
        }
    }
};
