const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const HelperUtils = require('../utils/helpers');
const { database } = require('../database/database');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('matches')
        .setDescription('عرض مباريات اليوم')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('الدوري المحدد (اختياري)')
                .setRequired(false)
                .addChoices(
                    { name: 'الدوري الإنجليزي', value: 'PL' },
                    { name: 'الدوري الإسباني', value: 'PD' },
                    { name: 'الدوري الإيطالي', value: 'SA' },
                    { name: 'الدوري الألماني', value: 'BL1' },
                    { name: 'الدوري الفرنسي', value: 'FL1' },
                    { name: 'دوري أبطال أوروبا', value: 'CL' }
                ))
        .addBooleanOption(option =>
            option.setName('show_all')
                .setDescription('عرض جميع المباريات (وليس المفضلة فقط)')
                .setRequired(false)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const league = interaction.options.getString('league');
            const showAll = interaction.options.getBoolean('show_all') || false;
            const userId = interaction.user.id;

            // إعداد الاستعلام
            const today = HelperUtils.getTodayDate();
            let endpoint = `/matches?dateFrom=${today}&dateTo=${today}`;
            
            if (league) {
                endpoint += `&competitions=${league}`;
            }

            // جلب البيانات من API
            const data = await HelperUtils.makeAPIRequest(endpoint);
            
            if (data.error) {
                const errorEmbed = EmbedUtils.createErrorEmbed(
                    `خطأ في جلب البيانات: ${data.error}`
                );
                return await interaction.followUp({ embeds: [errorEmbed] });
            }

            let matches = data.matches || [];

            // فلترة المباريات حسب الفرق المفضلة إذا لم يطلب المستخدم عرض الكل
            const shouldFilter = !showAll && !league && await HelperUtils.shouldShowOnlyFavorites(userId);
            
            if (shouldFilter) {
                const originalCount = matches.length;
                matches = await HelperUtils.filterMatchesByFavorites(matches, userId);
                
                if (matches.length === 0 && originalCount > 0) {
                    const embed = EmbedUtils.createInfoEmbed(
                        '⭐ مباريات فرقك المفضلة اليوم',
                        `لا توجد مباريات لفرقك المفضلة اليوم\n\n💡 استخدم \`/matches show_all:True\` لعرض جميع المباريات (${originalCount} مباراة متاحة)\n🔧 أو استخدم \`/add_team\` لإضافة المزيد من الفرق المفضلة`,
                        config.colors.warning
                    );
                    return await interaction.followUp({ embeds: [embed] });
                }
            }

            if (matches.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '📅 مباريات اليوم',
                    'لا توجد مباريات مجدولة اليوم',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // تجميع المباريات حسب البطولة
            const competitions = HelperUtils.groupMatchesByCompetition(matches);
            const favoriteTeams = await database.getUserFavoriteTeams(userId);
            
            const embeds = [];
            const titlePrefix = shouldFilter ? "⭐ مباريات فرقك المفضلة" : "📅 مباريات اليوم";

            for (const [competitionName, competitionMatches] of Object.entries(competitions)) {
                const embed = EmbedUtils.createInfoEmbed(
                    `${titlePrefix} - ${competitionName}`,
                    '',
                    config.colors.match.scheduled
                );

                const limitedMatches = competitionMatches.slice(0, config.matches.maxPerEmbed);
                
                for (const match of limitedMatches) {
                    const homeTeam = match.homeTeam.name;
                    const awayTeam = match.awayTeam.name;
                    
                    // إضافة رمز نجمة للفرق المفضلة
                    const homeTeamDisplay = EmbedUtils.addFavoriteStars(homeTeam, favoriteTeams);
                    const awayTeamDisplay = EmbedUtils.addFavoriteStars(awayTeam, favoriteTeams);
                    
                    // تحديد الحالة والنتيجة
                    let status, score;
                    
                    if (match.score.fullTime.home !== null) {
                        score = HelperUtils.formatScore(match);
                        status = "✅";
                    } else if (match.status === 'IN_PLAY' || match.status === 'LIVE') {
                        score = HelperUtils.formatScore(match);
                        status = "🔴";
                    } else {
                        const matchTime = new Date(match.utcDate);
                        const timestamp = Math.floor(matchTime.getTime() / 1000);
                        score = `<t:${timestamp}:t>`;
                        status = "⏳";
                    }

                    embed.addFields({
                        name: `${status} ${homeTeamDisplay} 🆚 ${awayTeamDisplay}`,
                        value: `**${score}**`,
                        inline: false
                    });
                }

                embeds.push(embed);
            }

            // إضافة تلميح في النهاية
            if (embeds.length > 0 && shouldFilter) {
                const lastEmbed = embeds[embeds.length - 1];
                const userTeamsCount = favoriteTeams.length;
                
                if (userTeamsCount === 0) {
                    lastEmbed.addFields({
                        name: '💡 نصيحة',
                        value: 'استخدم `/add_team` لإضافة فرقك المفضلة والحصول على تحديثات مخصصة!',
                        inline: false
                    });
                } else {
                    lastEmbed.addFields({
                        name: '⭐ فرقك المفضلة',
                        value: `لديك ${userTeamsCount} فريق مفضل • استخدم \`/my_teams\` لعرضهم`,
                        inline: false
                    });
                }
            }

            // إرسال الـ embeds
            for (const embed of embeds) {
                await interaction.followUp({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in matches command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed(
                'حدث خطأ أثناء جلب مباريات اليوم. يرجى المحاولة مرة أخرى.'
            );
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر مباريات الغد
const tomorrowCommand = {
    data: new SlashCommandBuilder()
        .setName('tomorrow')
        .setDescription('عرض مباريات الغد')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('الدوري المحدد (اختياري)')
                .setRequired(false)
                .addChoices(
                    { name: 'الدوري الإنجليزي', value: 'PL' },
                    { name: 'الدوري الإسباني', value: 'PD' },
                    { name: 'الدوري الإيطالي', value: 'SA' },
                    { name: 'الدوري الألماني', value: 'BL1' },
                    { name: 'الدوري الفرنسي', value: 'FL1' },
                    { name: 'دوري أبطال أوروبا', value: 'CL' }
                ))
        .addBooleanOption(option =>
            option.setName('show_all')
                .setDescription('عرض جميع المباريات (وليس المفضلة فقط)')
                .setRequired(false)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const league = interaction.options.getString('league');
            const showAll = interaction.options.getBoolean('show_all') || false;
            const userId = interaction.user.id;

            // إعداد الاستعلام
            const tomorrow = HelperUtils.getTomorrowDate();
            let endpoint = `/matches?dateFrom=${tomorrow}&dateTo=${tomorrow}`;
            
            if (league) {
                endpoint += `&competitions=${league}`;
            }

            // جلب البيانات من API
            const data = await HelperUtils.makeAPIRequest(endpoint);
            
            if (data.error) {
                const errorEmbed = EmbedUtils.createErrorEmbed(
                    `خطأ في جلب البيانات: ${data.error}`
                );
                return await interaction.followUp({ embeds: [errorEmbed] });
            }

            let matches = data.matches || [];

            // فلترة المباريات حسب الفرق المفضلة
            const shouldFilter = !showAll && !league && await HelperUtils.shouldShowOnlyFavorites(userId);
            
            if (shouldFilter) {
                const originalCount = matches.length;
                matches = await HelperUtils.filterMatchesByFavorites(matches, userId);
                
                if (matches.length === 0 && originalCount > 0) {
                    const embed = EmbedUtils.createInfoEmbed(
                        '⭐ مباريات فرقك المفضلة غداً',
                        `لا توجد مباريات لفرقك المفضلة غداً\n\n💡 استخدم \`/tomorrow show_all:True\` لعرض جميع المباريات (${originalCount} مباراة متاحة)`,
                        config.colors.warning
                    );
                    return await interaction.followUp({ embeds: [embed] });
                }
            }

            if (matches.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '📅 مباريات الغد',
                    'لا توجد مباريات مجدولة غداً',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // إنشاء الـ embed
            const titlePrefix = shouldFilter ? "⭐ مباريات فرقك المفضلة غداً" : "🗓️ مباريات الغد";
            const embed = EmbedUtils.createInfoEmbed(titlePrefix, '', config.colors.primary);

            const favoriteTeams = await database.getUserFavoriteTeams(userId);
            const limitedMatches = matches.slice(0, 15);

            for (const match of limitedMatches) {
                const homeTeam = match.homeTeam.name;
                const awayTeam = match.awayTeam.name;
                const matchTime = new Date(match.utcDate);
                const timestamp = Math.floor(matchTime.getTime() / 1000);

                // إضافة رمز نجمة للفرق المفضلة
                const homeTeamDisplay = EmbedUtils.addFavoriteStars(homeTeam, favoriteTeams);
                const awayTeamDisplay = EmbedUtils.addFavoriteStars(awayTeam, favoriteTeams);

                embed.addFields({
                    name: `🏟️ ${homeTeamDisplay} 🆚 ${awayTeamDisplay}`,
                    value: `🕐 <t:${timestamp}:t>\n🏆 ${match.competition.name}`,
                    inline: true
                });
            }

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in tomorrow command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed(
                'حدث خطأ أثناء جلب مباريات الغد. يرجى المحاولة مرة أخرى.'
            );
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر المباريات القادمة
const upcomingCommand = {
    data: new SlashCommandBuilder()
        .setName('upcoming')
        .setDescription('عرض المباريات القادمة')
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('عدد الأيام (افتراضي: 7)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(30))
        .addStringOption(option =>
            option.setName('league')
                .setDescription('الدوري المحدد (اختياري)')
                .setRequired(false)
                .addChoices(
                    { name: 'الدوري الإنجليزي', value: 'PL' },
                    { name: 'الدوري الإسباني', value: 'PD' },
                    { name: 'الدوري الإيطالي', value: 'SA' },
                    { name: 'الدوري الألماني', value: 'BL1' },
                    { name: 'الدوري الفرنسي', value: 'FL1' },
                    { name: 'دوري أبطال أوروبا', value: 'CL' }
                ))
        .addBooleanOption(option =>
            option.setName('show_all')
                .setDescription('عرض جميع المباريات (وليس المفضلة فقط)')
                .setRequired(false)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const days = interaction.options.getInteger('days') || config.matches.defaultDays;
            const league = interaction.options.getString('league');
            const showAll = interaction.options.getBoolean('show_all') || false;
            const userId = interaction.user.id;

            // إعداد الاستعلام
            const today = HelperUtils.getTodayDate();
            const endDate = HelperUtils.getDateAfterDays(days);
            let endpoint = `/matches?dateFrom=${today}&dateTo=${endDate}`;
            
            if (league) {
                endpoint += `&competitions=${league}`;
            }

            // جلب البيانات من API
            const data = await HelperUtils.makeAPIRequest(endpoint);
            
            if (data.error) {
                const errorEmbed = EmbedUtils.createErrorEmbed(
                    `خطأ في جلب البيانات: ${data.error}`
                );
                return await interaction.followUp({ embeds: [errorEmbed] });
            }

            let matches = (data.matches || []).filter(match => match.status === 'SCHEDULED');

            // فلترة المباريات حسب الفرق المفضلة
            const shouldFilter = !showAll && !league && await HelperUtils.shouldShowOnlyFavorites(userId);
            
            if (shouldFilter) {
                const originalCount = matches.length;
                matches = await HelperUtils.filterMatchesByFavorites(matches, userId);
                
                if (matches.length === 0 && originalCount > 0) {
                    const embed = EmbedUtils.createInfoEmbed(
                        `⭐ مباريات فرقك المفضلة (${days} أيام)`,
                        `لا توجد مباريات لفرقك المفضلة في الفترة المحددة\n\n💡 استخدم \`/upcoming show_all:True\` لعرض جميع المباريات (${originalCount} مباراة متاحة)`,
                        config.colors.warning
                    );
                    return await interaction.followUp({ embeds: [embed] });
                }
            }

            if (matches.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    `📅 المباريات القادمة (${days} أيام)`,
                    'لا توجد مباريات مجدولة في الفترة المحددة',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // تجميع المباريات حسب التاريخ
            const matchesByDate = HelperUtils.groupMatchesByDate(matches);
            const favoriteTeams = await database.getUserFavoriteTeams(userId);

            const titlePrefix = shouldFilter ? `⭐ مباريات فرقك المفضلة (${days} أيام)` : `🔮 المباريات القادمة (${days} أيام)`;
            const embed = EmbedUtils.createInfoEmbed(titlePrefix, '', config.colors.info);

            const sortedDates = Object.keys(matchesByDate).sort().slice(0, 7); // أقصى 7 أيام

            for (const date of sortedDates) {
                const dayMatches = matchesByDate[date];
                const dateObj = new Date(date);
                const dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });

                let matchesText = '';
                const limitedDayMatches = dayMatches.slice(0, config.matches.maxPerDay);

                for (const match of limitedDayMatches) {
                    const homeTeam = match.homeTeam.name;
                    const awayTeam = match.awayTeam.name;
                    const matchTime = new Date(match.utcDate);
                    const timestamp = Math.floor(matchTime.getTime() / 1000);

                    // إضافة رمز نجمة للفرق المفضلة
                    const homeTeamDisplay = EmbedUtils.addFavoriteStars(homeTeam, favoriteTeams);
                    const awayTeamDisplay = EmbedUtils.addFavoriteStars(awayTeam, favoriteTeams);

                    matchesText += `🏟️ ${homeTeamDisplay} 🆚 ${awayTeamDisplay}\n`;
                    matchesText += `🕐 <t:${timestamp}:t>\n`;
                    matchesText += `🏆 ${match.competition.name}\n\n`;
                }

                embed.addFields({
                    name: `📅 ${dayName} - ${date}`,
                    value: matchesText,
                    inline: false
                });
            }

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in upcoming command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed(
                'حدث خطأ أثناء جلب المباريات القادمة. يرجى المحاولة مرة أخرى.'
            );
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر المباريات المباشرة
const liveCommand = {
    data: new SlashCommandBuilder()
        .setName('live')
        .setDescription('عرض المباريات المباشرة الآن'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const liveMatches = await HelperUtils.getLiveMatches();

            if (liveMatches.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '🔴 المباريات المباشرة',
                    'لا توجد مباريات مباشرة حالياً',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                '🔴 المباريات المباشرة الآن',
                '',
                config.colors.match.live
            );

            const limitedMatches = liveMatches.slice(0, 10);

            for (const match of limitedMatches) {
                const homeTeam = match.homeTeam.name;
                const awayTeam = match.awayTeam.name;
                const currentScore = HelperUtils.formatScore(match);

                embed.addFields({
                    name: `⚽ ${homeTeam} 🆚 ${awayTeam}`,
                    value: `**${currentScore}** 🔴\n🏆 ${match.competition.name}`,
                    inline: true
                });
            }

            embed.setFooter({ text: 'يتم التحديث كل دقيقتين' });
            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in live command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed(
                'حدث خطأ أثناء جلب المباريات المباشرة. يرجى المحاولة مرة أخرى.'
            );
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// تصدير جميع الأوامر
module.exports.tomorrow = tomorrowCommand;
module.exports.upcoming = upcomingCommand;
module.exports.live = liveCommand;