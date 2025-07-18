const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const HelperUtils = require('../utils/helpers');
const { database } = require('../database/database');
const config = require('../config/config');

// أمر إضافة فريق للمفضلة
const addTeamCommand = {
    data: new SlashCommandBuilder()
        .setName('add_team')
        .setDescription('إضافة فريق للمفضلة')
        .addStringOption(option =>
            option.setName('team_name')
                .setDescription('اسم الفريق')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const teamName = interaction.options.getString('team_name');
            const userId = interaction.user.id;

            // البحث عن الفريق في قاعدة البيانات
            const teams = await database.searchTeams(teamName, 5);

            if (teams.length === 0) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على فريق بالاسم: **${teamName}**\n\n💡 جرب الأسماء التالية:\n• Real Madrid\n• Manchester City\n• Barcelona\n• Liverpool\n• Al Hilal\n• النصر`,
                    '❌ لم يتم العثور على الفريق'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            if (teams.length === 1) {
                // إضافة الفريق مباشرة
                const team = teams[0];
                const { team_id, team_name: fullName, league, team_short_name, country } = team;

                // التحقق من عدم وجود الفريق مسبقاً
                const existingTeam = await database.get(
                    'SELECT 1 FROM user_favorites WHERE user_id = ? AND team_id = ?',
                    [userId, team_id]
                );

                if (existingTeam) {
                    const embed = EmbedUtils.createWarningEmbed(
                        `**${fullName}** موجود بالفعل في قائمة فرقك المفضلة!`,
                        '⚠️ الفريق موجود بالفعل'
                    );
                    return await interaction.followUp({ embeds: [embed] });
                }

                // إضافة الفريق
                await database.addFavoriteTeam(userId, team_id, fullName, league);

                const flag = HelperUtils.getCountryFlag(country);
                const embed = EmbedUtils.createSuccessEmbed('', '⭐ تم إضافة الفريق بنجاح!')
                    .addFields(
                        { name: 'الفريق', value: `**${fullName}**`, inline: true },
                        { name: 'الدوري', value: league, inline: true },
                        { name: 'البلد', value: `${country} ${flag}`, inline: true },
                        { name: '🎉 تهانينا!', value: 'ستحصل الآن على تحديثات مخصصة لمباريات هذا الفريق', inline: false }
                    );

                await interaction.followUp({ embeds: [embed] });

            } else {
                // عرض خيارات متعددة للاختيار
                const embed = EmbedUtils.createInfoEmbed(
                    `🔍 نتائج البحث عن: ${teamName}`,
                    'تم العثور على عدة فرق، اختر الفريق المطلوب:'
                );

                let optionsText = '';
                for (let i = 0; i < teams.length; i++) {
                    const team = teams[i];
                    const flag = HelperUtils.getCountryFlag(team.country);
                    optionsText += `**${i + 1}.** ${team.team_name} ${flag}\n   ┗ ${team.league} • ${team.country}\n\n`;
                }

                embed.addFields(
                    { name: 'الفرق المتاحة:', value: optionsText, inline: false },
                    { name: '💡 كيفية الاختيار', value: 'استخدم `/add_team` مع الاسم الكامل الصحيح من القائمة أعلاه', inline: false }
                );

                await interaction.followUp({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in add_team command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء إضافة الفريق. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إزالة فريق من المفضلة
const removeTeamCommand = {
    data: new SlashCommandBuilder()
        .setName('remove_team')
        .setDescription('إزالة فريق من المفضلة')
        .addStringOption(option =>
            option.setName('team_name')
                .setDescription('اسم الفريق')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const teamName = interaction.options.getString('team_name');
            const userId = interaction.user.id;

            // البحث عن الفريق في مفضلة المستخدم
            const team = await database.get(`
                SELECT team_id, team_name, league 
                FROM user_favorites 
                WHERE user_id = ? AND (LOWER(team_name) LIKE ? OR LOWER(team_name) = ?)
            `, [userId, `%${teamName.toLowerCase()}%`, teamName.toLowerCase()]);

            if (!team) {
                const embed = EmbedUtils.createErrorEmbed(
                    `**${teamName}** غير موجود في قائمة فرقك المفضلة\n\n💡 استخدم \`/my_teams\` لعرض فرقك المفضلة`,
                    '❌ الفريق غير موجود'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // إزالة الفريق
            await database.removeFavoriteTeam(userId, teamName);

            const embed = EmbedUtils.createInfoEmbed(
                '🗑️ تم إزالة الفريق',
                `تم إزالة **${team.team_name}** من قائمة فرقك المفضلة`,
                config.colors.warning
            );
            embed.addFields({ name: 'الدوري', value: team.league, inline: true });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in remove_team command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء إزالة الفريق. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر عرض الفرق المفضلة
const myTeamsCommand = {
    data: new SlashCommandBuilder()
        .setName('my_teams')
        .setDescription('عرض فرقك المفضلة'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const favoriteTeams = await database.getUserFavoriteTeams(userId);

            if (favoriteTeams.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '⭐ فرقك المفضلة',
                    'لم تقم بإضافة أي فريق مفضل بعد\n\n💡 استخدم `/add_team [اسم الفريق]` لإضافة فريقك المفضل',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `⭐ فرقك المفضلة (${favoriteTeams.length})`,
                '',
                config.colors.success
            );

            // تجميع الفرق حسب الدوري
            const leagues = {};
            for (const team of favoriteTeams) {
                const league = team.league;
                if (!leagues[league]) {
                    leagues[league] = [];
                }
                leagues[league].push(team);
            }

            for (const [league, teams] of Object.entries(leagues)) {
                let teamsText = '';
                for (const team of teams) {
                    const flag = HelperUtils.getCountryFlag(team.country);
                    const addedDate = new Date(team.added_date).toLocaleDateString('ar-SA');
                    teamsText += `⭐ **${team.team_name}** ${flag}\n   ┗ أضيف في: ${addedDate}\n\n`;
                }

                embed.addFields({
                    name: `🏆 ${league}`,
                    value: teamsText,
                    inline: true
                });
            }

            embed.addFields({
                name: '🔧 إدارة الفرق',
                value: '• `/add_team [اسم]` - إضافة فريق\n• `/remove_team [اسم]` - إزالة فريق\n• `/team_matches [اسم]` - مباريات فريق',
                inline: false
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in my_teams command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب فرقك المفضلة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر مباريات فريق معين
const teamMatchesCommand = {
    data: new SlashCommandBuilder()
        .setName('team_matches')
        .setDescription('عرض مباريات فريق معين')
        .addStringOption(option =>
            option.setName('team_name')
                .setDescription('اسم الفريق')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('عدد الأيام القادمة (افتراضي: 7)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(30)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const teamName = interaction.options.getString('team_name');
            const days = interaction.options.getInteger('days') || 7;

            // جلب مباريات الفريق
            const matches = await HelperUtils.getTeamMatches(teamName, days);

            if (matches.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    `📅 مباريات ${teamName}`,
                    `لا توجد مباريات لـ **${teamName}** في الـ ${days} أيام القادمة`,
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `⚽ مباريات ${teamName} (${days} أيام)`,
                '',
                config.colors.primary
            );

            const limitedMatches = matches.slice(0, 10);

            for (const match of limitedMatches) {
                let homeTeam = match.homeTeam.name;
                let awayTeam = match.awayTeam.name;
                const matchTime = new Date(match.utcDate);
                const timestamp = Math.floor(matchTime.getTime() / 1000);

                // تمييز الفريق المطلوب
                if (HelperUtils.isTeamMatch(homeTeam, teamName)) {
                    homeTeam = `**${homeTeam}** ⭐`;
                }
                if (HelperUtils.isTeamMatch(awayTeam, teamName)) {
                    awayTeam = `**${awayTeam}** ⭐`;
                }

                // الحالة والنتيجة
                let status, score;
                if (match.status === 'FINISHED') {
                    score = HelperUtils.formatScore(match);
                    status = "✅";
                } else if (match.status === 'IN_PLAY' || match.status === 'LIVE') {
                    score = HelperUtils.formatScore(match);
                    status = "🔴";
                } else {
                    score = `<t:${timestamp}:F>`;
                    status = "⏳";
                }

                embed.addFields({
                    name: `${status} ${homeTeam} 🆚 ${awayTeam}`,
                    value: `🏆 ${match.competition.name}\n⚽ ${score}`,
                    inline: false
                });
            }

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in team_matches command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب مباريات الفريق. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر البحث عن فرق
const searchTeamsCommand = {
    data: new SlashCommandBuilder()
        .setName('search_teams')
        .setDescription('البحث عن فرق')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('البحث (اسم الفريق، الدوري، أو البلد)')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const query = interaction.options.getString('query');
            const teams = await database.searchTeams(query, 15);

            if (teams.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '🔍 نتائج البحث',
                    `لم يتم العثور على فرق تحتوي على: **${query}**`,
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `🔍 نتائج البحث: ${query}`,
                `تم العثور على ${teams.length} فريق`
            );

            // تجميع النتائج حسب الدوري
            const leagues = {};
            for (const team of teams) {
                const league = team.league;
                if (!leagues[league]) {
                    leagues[league] = [];
                }
                leagues[league].push(team);
            }

            for (const [league, leagueTeams] of Object.entries(leagues)) {
                let teamsText = '';
                const limitedTeams = leagueTeams.slice(0, 5); // أقصى 5 فرق لكل دوري
                
                for (const team of limitedTeams) {
                    const flag = HelperUtils.getCountryFlag(team.country);
                    const shortDisplay = team.team_short_name !== team.team_name ? ` (${team.team_short_name})` : '';
                    const yearDisplay = team.established_year ? ` • ${team.established_year}` : '';

                    teamsText += `⚽ **${team.team_name}**${shortDisplay} ${flag}\n`;
                    teamsText += `   ┗ ${team.country}${yearDisplay}\n`;
                }

                embed.addFields({
                    name: `🏆 ${league}`,
                    value: teamsText,
                    inline: true
                });
            }

            embed.addFields({
                name: '💡 نصائح للبحث',
                value: '• استخدم أسماء الفرق بالإنجليزية\n• جرب البحث بالدوري (مثل: Premier League)\n• جرب البحث بالبلد (مثل: Spain)',
                inline: false
            });

            embed.setFooter({ text: '🔍 نتائج البحث • استخدم /add_team لإضافة فريق' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in search_teams command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء البحث عن الفرق. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إحصائيات فريق
const teamStatsCommand = {
    data: new SlashCommandBuilder()
        .setName('team_stats')
        .setDescription('إحصائيات فريق معين')
        .addStringOption(option =>
            option.setName('team_name')
                .setDescription('اسم الفريق')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const teamName = interaction.options.getString('team_name');
            const userId = interaction.user.id;

            // البحث عن الفريق
            const teams = await database.searchTeams(teamName, 1);

            if (teams.length === 0) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على فريق بالاسم: **${teamName}**`,
                    '❌ لم يتم العثور على الفريق'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const team = teams[0];

            // جلب مباريات الفريق
            const matches = await HelperUtils.getTeamMatches(team.team_name, 30);

            // التحقق من كونه في المفضلة
            const isInFavorites = await HelperUtils.isTeamInFavorites(userId, team.team_name);

            // إنشاء الـ embed
            const embed = EmbedUtils.createTeamEmbed(team, isInFavorites);

            // إضافة إحصائيات المباريات
            const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED');
            const finishedMatches = matches.filter(m => m.status === 'FINISHED');

            embed.addFields(
                { name: '📅 المباريات القادمة', value: `${upcomingMatches.length} مباراة`, inline: true },
                { name: '✅ المباريات المنتهية', value: `${finishedMatches.length} مباراة`, inline: true }
            );

            // المباراة القادمة
            if (upcomingMatches.length > 0) {
                const nextMatch = upcomingMatches[0];
                embed.nextMatch = nextMatch;
            }

            // إضافة إحصائيات اللاعبين من الفريق
            const players = await database.all(`
                SELECT COUNT(*) as count, GROUP_CONCAT(player_name, ', ') as names 
                FROM players_data 
                WHERE LOWER(team_name) = LOWER(?)
                LIMIT 5
            `, [team.team_name]);

            if (players[0] && players[0].count > 0) {
                const playerNames = players[0].names.length > 100 ? 
                    players[0].names.substring(0, 100) + '...' : players[0].names;

                embed.addFields({
                    name: `🏃‍♂️ اللاعبين في قاعدة البيانات (${players[0].count})`,
                    value: playerNames,
                    inline: false
                });
            }

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in team_stats command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب إحصائيات الفريق. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// تصدير جميع الأوامر
module.exports = {
    addTeam: addTeamCommand,
    removeTeam: removeTeamCommand,
    myTeams: myTeamsCommand,
    teamMatches: teamMatchesCommand,
    searchTeams: searchTeamsCommand,
    teamStats: teamStatsCommand
};