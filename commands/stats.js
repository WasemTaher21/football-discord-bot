const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const HelperUtils = require('../utils/helpers');
const { database } = require('../database/database');
const config = require('../config/config');

// أمر ترتيب الدوري
const leagueStandingsCommand = {
    data: new SlashCommandBuilder()
        .setName('league_standings')
        .setDescription('عرض ترتيب الدوري')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('رمز الدوري')
                .setRequired(false)
                .addChoices(
                    { name: 'الدوري الإنجليزي', value: 'PL' },
                    { name: 'الدوري الإسباني', value: 'PD' },
                    { name: 'الدوري الإيطالي', value: 'SA' },
                    { name: 'الدوري الألماني', value: 'BL1' },
                    { name: 'الدوري الفرنسي', value: 'FL1' }
                )),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const league = interaction.options.getString('league') || 'PL';
            const leagueName = HelperUtils.getLeagueName(league);

            // محاولة جلب ترتيب الدوري
            const standings = await HelperUtils.getLeagueStandings(league);

            if (!standings || standings.length === 0) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لا يمكن جلب ترتيب ${leagueName} حالياً\n\n💡 جرب: PL, PD, SA, BL1, FL1`,
                    '❌ خطأ في جلب الترتيب'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `📊 ترتيب ${leagueName}`,
                '',
                config.colors.primary
            );

            // إضافة أفضل 10 فرق
            let topTeamsText = '';
            const topTeams = standings.slice(0, 10);

            for (let i = 0; i < topTeams.length; i++) {
                const team = topTeams[i];
                const position = i + 1;
                
                // رموز المراكز
                let positionIcon;
                if (position === 1) positionIcon = "🥇";
                else if (position === 2) positionIcon = "🥈";
                else if (position === 3) positionIcon = "🥉";
                else if (position <= 4) positionIcon = "🟢"; // دوري أبطال
                else if (position <= 6) positionIcon = "🟡"; // دوري أوروبا
                else positionIcon = "⚪";

                const teamName = team.team.name;
                const points = team.points;
                const played = team.playedGames;
                const wins = team.won;
                const draws = team.draw;
                const losses = team.lost;
                const goalsFor = team.goalsFor;
                const goalsAgainst = team.goalsAgainst;
                const goalDifference = team.goalDifference;

                topTeamsText += `${positionIcon} **${position}. ${teamName}**\n`;
                topTeamsText += `   📊 ${points} نقطة • ${played} مباراة\n`;
                topTeamsText += `   ⚽ ${goalsFor}-${goalsAgainst} (${goalDifference >= 0 ? '+' : ''}${goalDifference})\n\n`;
            }

            embed.addFields({
                name: '🏆 أفضل 10 فرق',
                value: topTeamsText,
                inline: false
            });

            // إضافة معلومات إضافية
            const totalTeams = standings.length;
            const totalGoals = standings.reduce((sum, team) => sum + team.goalsFor, 0);

            embed.addFields({
                name: '📈 إحصائيات الدوري',
                value: `🏟️ عدد الفرق: ${totalTeams}\n🎯 الأهداف: ${totalGoals}\n📅 محدث: الآن`,
                inline: true
            });

            embed.setFooter({ text: '🟢 دوري أبطال • 🟡 دوري أوروبا • ⚪ عادي' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in league_standings command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب ترتيب الدوري. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إحصائيات المستخدم المفصلة
const userStatsCommand = {
    data: new SlashCommandBuilder()
        .setName('user_stats')
        .setDescription('إحصائياتك الشخصية المفصلة'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const stats = await HelperUtils.calculateUserStats(userId);

            const embed = EmbedUtils.createInfoEmbed(
                '📊 إحصائياتك المفصلة',
                `تحليل شامل لاستخدامك للبوت، ${interaction.user.displayName}`,
                config.colors.info
            );

            // الإحصائيات الأساسية
            embed.addFields({
                name: '⭐ المفضلة',
                value: `🏟️ ${stats.favoriteTeamsCount} فريق\n🏃‍♂️ ${stats.favoritePlayersCount} لاعب\n📊 ${stats.totalFavorites} إجمالي`,
                inline: true
            });

            // توزيع الدوريات
            if (stats.leaguesDistribution.length > 0) {
                let leaguesText = '';
                for (const league of stats.leaguesDistribution) {
                    const percentage = stats.favoriteTeamsCount > 0 ? 
                        ((league.count / stats.favoriteTeamsCount) * 100).toFixed(1) : 0;
                    leaguesText += `🏆 ${league.league}: ${league.count} (${percentage}%)\n`;
                }

                embed.addFields({
                    name: '🌍 توزيع الدوريات',
                    value: leaguesText,
                    inline: true
                });
            }

            // توزيع المراكز
            if (stats.positionsDistribution.length > 0) {
                let positionsText = '';
                for (const position of stats.positionsDistribution) {
                    const percentage = stats.favoritePlayersCount > 0 ? 
                        ((position.count / stats.favoritePlayersCount) * 100).toFixed(1) : 0;
                    const positionInfo = config.positions[position.position] || { emoji: '⚽' };
                    positionsText += `${positionInfo.emoji} ${position.position}: ${position.count} (${percentage}%)\n`;
                }

                embed.addFields({
                    name: '🎯 توزيع المراكز',
                    value: positionsText,
                    inline: true
                });
            }

            // معلومات زمنية
            if (stats.firstTeamDate) {
                const firstDate = new Date(stats.firstTeamDate);
                const daysSince = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24));
                const averagePerDay = daysSince > 0 ? (stats.totalFavorites / daysSince).toFixed(1) : 0;

                embed.addFields({
                    name: '📅 رحلتك مع البوت',
                    value: `🎯 أول فريق: ${firstDate.toLocaleDateString('ar-SA')}\n⏱️ منذ: ${daysSince} يوم\n📈 معدل الإضافة: ${averagePerDay}/يوم`,
                    inline: true
                });
            }

            // تقييم المستخدم
            const userLevel = HelperUtils.getUserLevel(stats.totalFavorites);

            embed.addFields({
                name: '🏅 مستواك',
                value: `${userLevel.level}\n💡 ${userLevel.advice}`,
                inline: true
            });

            // اقتراحات شخصية
            const suggestions = [];
            if (stats.favoriteTeamsCount === 0) {
                suggestions.push('• أضف فريقك المفضل بـ `/add_team`');
            }
            if (stats.favoritePlayersCount === 0) {
                suggestions.push('• أضف لاعبك المفضل بـ `/add_player`');
            }
            if (stats.leaguesDistribution.length === 1) {
                suggestions.push('• جرب متابعة دوري آخر!');
            }

            if (suggestions.length > 0) {
                embed.addFields({
                    name: '💡 اقتراحات لك',
                    value: suggestions.join('\n'),
                    inline: false
                });
            }

            // مقارنة مع المتوسط (افتراضية)
            const avgTeams = 3.2;
            const avgPlayers = 2.8;

            embed.addFields({
                name: '📈 مقارنة مع المتوسط',
                value: `🏟️ فرق: ${stats.favoriteTeamsCount} (متوسط: ${avgTeams})\n🏃‍♂️ لاعبين: ${stats.favoritePlayersCount} (متوسط: ${avgPlayers})`,
                inline: true
            });

            embed.setFooter({ text: '📊 إحصائيات محدثة • استخدم /my_dashboard للملخص' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in user_stats command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب إحصائياتك. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إحصائيات مباراة معينة
const matchStatsCommand = {
    data: new SlashCommandBuilder()
        .setName('match_stats')
        .setDescription('إحصائيات مباراة معينة')
        .addIntegerOption(option =>
            option.setName('match_id')
                .setDescription('معرف المباراة')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const matchId = interaction.options.getInteger('match_id');

            // جلب تفاصيل المباراة
            const matchData = await HelperUtils.makeAPIRequest(`/matches/${matchId}`);

            if (matchData.error) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على المباراة: ${matchData.error}`,
                    '❌ مباراة غير موجودة'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            if (matchData.status !== 'FINISHED') {
                const embed = EmbedUtils.createWarningEmbed(
                    'هذه المباراة لم تنته بعد!',
                    '⚠️ مباراة لم تنته'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // الحصول على معلومات البث
            const broadcastInfo = await HelperUtils.getBroadcastInfo(matchData.competition.name);

            // إنشاء الـ embed
            const embed = EmbedUtils.createMatchEmbed(
                matchData, 
                '📊 إحصائيات المباراة', 
                broadcastInfo
            );

            // إضافة إحصائيات إضافية إذا كانت متوفرة
            if (matchData.score && matchData.score.penalties) {
                embed.addFields({
                    name: '🥅 ركلات الترجيح',
                    value: `${matchData.score.penalties.home} - ${matchData.score.penalties.away}`,
                    inline: true
                });
            }

            // ملاحظة: يمكن إضافة المزيد من الإحصائيات هنا إذا كانت متوفرة من API
            embed.addFields({
                name: '📈 إحصائيات تفصيلية',
                value: '*سيتم إضافة إحصائيات أكثر تفصيلاً قريباً*\n(حيازة الكرة، التسديدات، الكروت، إلخ)',
                inline: false
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in match_stats command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب إحصائيات المباراة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر توقع نتيجة مباراة
const predictMatchCommand = {
    data: new SlashCommandBuilder()
        .setName('predict_match')
        .setDescription('توقع نتيجة مباراة (للترفيه)')
        .addStringOption(option =>
            option.setName('team1')
                .setDescription('الفريق الأول')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('team2')
                .setDescription('الفريق الثاني')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const team1 = interaction.options.getString('team1');
            const team2 = interaction.options.getString('team2');

            // البحث عن المباراة القادمة بين الفريقين
            const today = HelperUtils.getTodayDate();
            const endDate = HelperUtils.getDateAfterDays(30);

            const data = await HelperUtils.makeAPIRequest(`/matches?dateFrom=${today}&dateTo=${endDate}`);

            let targetMatch = null;
            if (!data.error && data.matches) {
                for (const match of data.matches) {
                    const homeTeam = match.homeTeam.name.toLowerCase();
                    const awayTeam = match.awayTeam.name.toLowerCase();

                    if ((team1.toLowerCase().includes(homeTeam) && team2.toLowerCase().includes(awayTeam)) ||
                        (team2.toLowerCase().includes(homeTeam) && team1.toLowerCase().includes(awayTeam))) {
                        targetMatch = match;
                        break;
                    }
                }
            }

            const embed = EmbedUtils.createInfoEmbed(
                '🔮 توقع المباراة',
                'تحليل AI متقدم لتوقع نتيجة المباراة (للترفيه)',
                config.colors.info
            );

            if (targetMatch) {
                const homeTeam = targetMatch.homeTeam.name;
                const awayTeam = targetMatch.awayTeam.name;
                const matchTime = new Date(targetMatch.utcDate);
                const timestamp = Math.floor(matchTime.getTime() / 1000);

                embed.addFields({
                    name: '⚽ المباراة',
                    value: `**${homeTeam}** 🆚 **${awayTeam}**\n🕐 <t:${timestamp}:F>\n🏆 ${targetMatch.competition.name}`,
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '⚽ المباراة المتوقعة',
                    value: `**${team1}** 🆚 **${team2}**\n*لم يتم العثور على مباراة مجدولة*`,
                    inline: false
                });
            }

            // توقع النتيجة (عشوائي للترفيه)
            const team1Score = Math.floor(Math.random() * 5);
            const team2Score = Math.floor(Math.random() * 5);

            // تحديد الفائز
            let winner, resultIcon;
            if (team1Score > team2Score) {
                winner = team1;
                resultIcon = "🏆";
            } else if (team2Score > team1Score) {
                winner = team2;
                resultIcon = "🏆";
            } else {
                winner = "تعادل";
                resultIcon = "🤝";
            }

            embed.addFields({
                name: '📊 التوقع',
                value: `**${team1}** ${team1Score} - ${team2Score} **${team2}**\n${resultIcon} النتيجة المتوقعة`,
                inline: true
            });

            // احتمالات الفوز (عشوائية)
            const team1Prob = Math.floor(Math.random() * 50) + 25;
            const team2Prob = Math.floor(Math.random() * 50) + 25;
            const drawProb = 100 - team1Prob - team2Prob;

            embed.addFields({
                name: '📈 احتمالات الفوز',
                value: `🏆 ${team1}: ${team1Prob}%\n🤝 تعادل: ${Math.max(drawProb, 10)}%\n🏆 ${team2}: ${team2Prob}%`,
                inline: true
            });

            // توقعات إضافية
            const predictions = [
                `⚽ أول هدف: دقيقة ${Math.floor(Math.random() * 40) + 5}`,
                `🟨 كروت صفراء: ${Math.floor(Math.random() * 7) + 2}`,
                `🔄 تبديلات: ${Math.floor(Math.random() * 3) + 4}`,
                `⏱️ وقت ضائع: ${Math.floor(Math.random() * 5) + 2} دقائق`
            ];

            embed.addFields({
                name: '🎯 توقعات إضافية',
                value: predictions.join('\n'),
                inline: false
            });

            // إضافة تحذير
            embed.addFields({
                name: '⚠️ تنبيه مهم',
                value: 'هذه التوقعات للترفيه فقط وليست مبنية على تحليل حقيقي!\nلا تستخدمها للمراهنة أو اتخاذ قرارات مالية.',
                inline: false
            });

            embed.setFooter({ text: '🔮 توقعات AI • للترفيه فقط • غير مضمونة' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in predict_match command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء توقع المباراة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إحصائيات الخادم
const serverStatsCommand = {
    data: new SlashCommandBuilder()
        .setName('server_stats')
        .setDescription('إحصائيات استخدام البوت في الخادم'),

    async execute(interaction, client) {
        // التحقق من الصلاحيات
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            const embed = EmbedUtils.createErrorEmbed(
                'هذا الأمر مخصص للمدراء فقط!',
                '❌ ليس لديك صلاحية'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // إحصائيات عامة
            const totalUsers = await database.get('SELECT COUNT(DISTINCT user_id) as count FROM user_favorites');
            const totalTeams = await database.get('SELECT COUNT(*) as count FROM user_favorites');
            const totalPlayers = await database.get('SELECT COUNT(*) as count FROM user_favorite_players');
            
            // أكثر الفرق متابعة
            const popularTeams = await database.all(`
                SELECT team_name, COUNT(*) as followers
                FROM user_favorites
                GROUP BY team_name
                ORDER BY followers DESC
                LIMIT 5
            `);

            // أكثر الدوريات متابعة
            const popularLeagues = await database.all(`
                SELECT league, COUNT(*) as followers
                FROM user_favorites
                GROUP BY league
                ORDER BY followers DESC
                LIMIT 5
            `);

            const embed = EmbedUtils.createInfoEmbed(
                '📊 إحصائيات الخادم',
                `إحصائيات استخدام البوت في **${interaction.guild.name}**`,
                config.colors.primary
            );

            embed.addFields(
                {
                    name: '👥 المستخدمين النشطين',
                    value: `${totalUsers?.count || 0} مستخدم`,
                    inline: true
                },
                {
                    name: '⭐ الفرق المتابعة',
                    value: `${totalTeams?.count || 0} فريق`,
                    inline: true
                },
                {
                    name: '🏃‍♂️ اللاعبين المتابعين',
                    value: `${totalPlayers?.count || 0} لاعب`,
                    inline: true
                }
            );

            // أشهر الفرق
            if (popularTeams.length > 0) {
                let teamsText = '';
                for (let i = 0; i < popularTeams.length; i++) {
                    const team = popularTeams[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⚽';
                    teamsText += `${medal} ${team.team_name} (${team.followers} متابع)\n`;
                }

                embed.addFields({
                    name: '🏆 أشهر الفرق',
                    value: teamsText,
                    inline: true
                });
            }

            // أشهر الدوريات
            if (popularLeagues.length > 0) {
                let leaguesText = '';
                for (let i = 0; i < popularLeagues.length; i++) {
                    const league = popularLeagues[i];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏆';
                    leaguesText += `${medal} ${league.league} (${league.followers} متابع)\n`;
                }

                embed.addFields({
                    name: '🌍 أشهر الدوريات',
                    value: leaguesText,
                    inline: true
                });
            }

            // معلومات البوت
            const botStats = {
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                channels: client.channels.cache.size,
                uptime: Math.floor(client.uptime / (1000 * 60 * 60)) // ساعات
            };

            embed.addFields({
                name: '🤖 إحصائيات البوت',
                value: `🏠 ${botStats.guilds} خادم\n👥 ${botStats.users} مستخدم\n📱 ${botStats.channels} قناة\n⏰ ${botStats.uptime} ساعة تشغيل`,
                inline: true
            });

            embed.setFooter({ text: '📊 إحصائيات محدثة • للمدراء فقط' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in server_stats command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب إحصائيات الخادم. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// تصدير جميع الأوامر
module.exports = {
    leagueStandings: leagueStandingsCommand,
    userStats: userStatsCommand,
    matchStats: matchStatsCommand,
    predictMatch: predictMatchCommand,
    serverStats: serverStatsCommand
};