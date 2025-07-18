const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const HelperUtils = require('../utils/helpers');
const { database } = require('../database/database');
const config = require('../config/config');

// أمر إضافة لاعب للمفضلة
const addPlayerCommand = {
    data: new SlashCommandBuilder()
        .setName('add_player')
        .setDescription('إضافة لاعب للمفضلة')
        .addStringOption(option =>
            option.setName('player_name')
                .setDescription('اسم اللاعب')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const playerName = interaction.options.getString('player_name');
            const userId = interaction.user.id;

            // البحث عن اللاعب
            const players = await database.searchPlayers(playerName, 5);

            if (players.length === 0) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على لاعب بالاسم: **${playerName}**\n\n💡 جرب أسماء مثل:\n• Cristiano Ronaldo\n• Mohamed Salah\n• Neymar Jr\n• Erling Haaland`,
                    '❌ لم يتم العثور على اللاعب'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            if (players.length === 1) {
                // إضافة اللاعب مباشرة
                const player = players[0];
                const { player_id, player_name: fullName, team_name, position, nationality } = player;

                // التحقق من عدم وجود اللاعب مسبقاً
                const existingPlayer = await database.get(
                    'SELECT 1 FROM user_favorite_players WHERE user_id = ? AND player_id = ?',
                    [userId, player_id]
                );

                if (existingPlayer) {
                    const embed = EmbedUtils.createWarningEmbed(
                        `**${fullName}** موجود بالفعل في قائمة لاعبيك المفضلين!`,
                        '⚠️ اللاعب موجود بالفعل'
                    );
                    return await interaction.followUp({ embeds: [embed] });
                }

                // إضافة اللاعب
                await database.addFavoritePlayer(userId, player_id, fullName, team_name, position, nationality);

                const flag = HelperUtils.getCountryFlag(nationality);
                const positionInfo = config.positions[position] || { emoji: '⚽', arabic: position };
                
                const embed = EmbedUtils.createSuccessEmbed('', '⭐ تم إضافة اللاعب بنجاح!')
                    .addFields(
                        { name: 'اللاعب', value: `**${fullName}**`, inline: true },
                        { name: 'الفريق', value: team_name, inline: true },
                        { name: 'المركز', value: `${positionInfo.emoji} ${positionInfo.arabic}`, inline: true },
                        { name: 'الجنسية', value: `${nationality} ${flag}`, inline: true }
                    );

                if (player.age) {
                    embed.addFields({ name: 'العمر', value: `${player.age} سنة`, inline: true });
                }

                if (player.jersey_number) {
                    embed.addFields({ name: 'الرقم', value: `#${player.jersey_number}`, inline: true });
                }

                if (player.market_value) {
                    embed.addFields({ name: 'القيمة السوقية', value: player.market_value, inline: true });
                }

                await interaction.followUp({ embeds: [embed] });

            } else {
                // عرض خيارات متعددة
                const embed = EmbedUtils.createInfoEmbed(
                    `🔍 نتائج البحث عن: ${playerName}`,
                    'تم العثور على عدة لاعبين، اختر اللاعب المطلوب:'
                );

                let optionsText = '';
                for (let i = 0; i < players.length; i++) {
                    const player = players[i];
                    const flag = HelperUtils.getCountryFlag(player.nationality);
                    const jerseyDisplay = player.jersey_number ? `#${player.jersey_number}` : '#?';
                    
                    optionsText += `**${i + 1}.** ${player.player_name} ${flag}\n`;
                    optionsText += `   ┗ ${player.team_name} • ${player.position} • ${jerseyDisplay}\n\n`;
                }

                embed.addFields(
                    { name: 'اللاعبين المتاحين:', value: optionsText, inline: false },
                    { name: '💡 كيفية الاختيار', value: 'استخدم `/add_player` مع الاسم الكامل الصحيح من القائمة أعلاه', inline: false }
                );

                await interaction.followUp({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in add_player command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء إضافة اللاعب. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إزالة لاعب من المفضلة
const removePlayerCommand = {
    data: new SlashCommandBuilder()
        .setName('remove_player')
        .setDescription('إزالة لاعب من المفضلة')
        .addStringOption(option =>
            option.setName('player_name')
                .setDescription('اسم اللاعب')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const playerName = interaction.options.getString('player_name');
            const userId = interaction.user.id;

            // البحث عن اللاعب في مفضلة المستخدم
            const player = await database.get(`
                SELECT player_id, player_name, team_name, position 
                FROM user_favorite_players 
                WHERE user_id = ? AND (LOWER(player_name) LIKE ? OR LOWER(player_name) = ?)
            `, [userId, `%${playerName.toLowerCase()}%`, playerName.toLowerCase()]);

            if (!player) {
                const embed = EmbedUtils.createErrorEmbed(
                    `**${playerName}** غير موجود في قائمة لاعبيك المفضلين\n\n💡 استخدم \`/my_players\` لعرض لاعبيك المفضلين`,
                    '❌ اللاعب غير موجود'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // إزالة اللاعب
            await database.removeFavoritePlayer(userId, playerName);

            const embed = EmbedUtils.createInfoEmbed(
                '🗑️ تم إزالة اللاعب',
                `تم إزالة **${player.player_name}** من قائمة لاعبيك المفضلين`,
                config.colors.warning
            );
            embed.addFields(
                { name: 'الفريق', value: player.team_name, inline: true },
                { name: 'المركز', value: player.position, inline: true }
            );

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in remove_player command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء إزالة اللاعب. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر عرض اللاعبين المفضلين
const myPlayersCommand = {
    data: new SlashCommandBuilder()
        .setName('my_players')
        .setDescription('عرض لاعبيك المفضلين'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const favoritePlayers = await database.getUserFavoritePlayers(userId);

            if (favoritePlayers.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '⭐ لاعبوك المفضلون',
                    'لم تقم بإضافة أي لاعب مفضل بعد\n\n💡 استخدم `/add_player [اسم اللاعب]` لإضافة لاعبك المفضل',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `⭐ لاعبوك المفضلون (${favoritePlayers.length})`,
                '',
                config.colors.success
            );

            // تجميع اللاعبين حسب المركز
            const positions = {};
            for (const player of favoritePlayers) {
                const position = player.position || 'غير محدد';
                if (!positions[position]) {
                    positions[position] = [];
                }
                positions[position].push(player);
            }

            for (const [position, players] of Object.entries(positions)) {
                const positionInfo = config.positions[position] || { emoji: '⚽', arabic: position };
                let playersText = '';
                
                const limitedPlayers = players.slice(0, 5); // أقصى 5 لاعبين لكل مركز
                
                for (const player of limitedPlayers) {
                    const flag = HelperUtils.getCountryFlag(player.nationality);
                    const jersey = player.jersey_number ? `#${player.jersey_number}` : '';
                    const age = player.age ? `(${player.age})` : '';

                    playersText += `⭐ **${player.player_name}** ${flag} ${jersey}\n`;
                    playersText += `   ┗ ${player.team_name} ${age}\n`;
                    
                    if (player.market_value) {
                        playersText += `   ┗ ${player.market_value}\n`;
                    }
                    playersText += '\n';
                }

                embed.addFields({
                    name: `${positionInfo.emoji} ${positionInfo.arabic}`,
                    value: playersText,
                    inline: true
                });
            }

            embed.addFields({
                name: '🔧 إدارة اللاعبين',
                value: '• `/add_player [اسم]` - إضافة لاعب\n• `/remove_player [اسم]` - إزالة لاعب\n• `/player_stats [اسم]` - إحصائيات لاعب',
                inline: false
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in my_players command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب لاعبيك المفضلين. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إحصائيات لاعب معين
const playerStatsCommand = {
    data: new SlashCommandBuilder()
        .setName('player_stats')
        .setDescription('إحصائيات لاعب معين')
        .addStringOption(option =>
            option.setName('player_name')
                .setDescription('اسم اللاعب')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const playerName = interaction.options.getString('player_name');
            const userId = interaction.user.id;

            // البحث عن اللاعب
            const players = await database.searchPlayers(playerName, 1);

            if (players.length === 0) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على لاعب بالاسم: **${playerName}**`,
                    '❌ لم يتم العثور على اللاعب'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const player = players[0];

            // التحقق من كونه في المفضلة
            const isInFavorites = await HelperUtils.isPlayerInFavorites(userId, player.player_name);

            // إنشاء الـ embed
            const embed = EmbedUtils.createPlayerEmbed(player, isInFavorites);

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in player_stats command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب إحصائيات اللاعب. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر البحث عن لاعبين
const searchPlayersCommand = {
    data: new SlashCommandBuilder()
        .setName('search_players')
        .setDescription('البحث عن لاعبين')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('البحث (اسم اللاعب، الفريق، أو الجنسية)')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const query = interaction.options.getString('query');
            
            // البحث عن اللاعبين
            const players = await database.all(`
                SELECT player_id, player_name, team_name, position, nationality, age, market_value, jersey_number
                FROM players_data 
                WHERE LOWER(player_name) LIKE ? 
                   OR LOWER(team_name) LIKE ?
                   OR LOWER(nationality) LIKE ?
                   OR LOWER(position) LIKE ?
                ORDER BY 
                    CASE 
                        WHEN LOWER(player_name) LIKE ? THEN 1
                        WHEN LOWER(team_name) LIKE ? THEN 2
                        ELSE 3
                    END
                LIMIT 15
            `, [
                `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`, 
                `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`,
                `${query.toLowerCase()}%`, `${query.toLowerCase()}%`
            ]);

            if (players.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '🔍 نتائج البحث',
                    `لم يتم العثور على لاعبين يحتوون على: **${query}**`,
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `🔍 نتائج البحث: ${query}`,
                `تم العثور على ${players.length} لاعب`
            );

            // تجميع النتائج حسب الفريق
            const teams = {};
            for (const player of players) {
                const team = player.team_name;
                if (!teams[team]) {
                    teams[team] = [];
                }
                teams[team].push(player);
            }

            for (const [team, teamPlayers] of Object.entries(teams)) {
                let playersText = '';
                const limitedPlayers = teamPlayers.slice(0, 4); // أقصى 4 لاعبين لكل فريق
                
                for (const player of limitedPlayers) {
                    const flag = HelperUtils.getCountryFlag(player.nationality);
                    const positionInfo = config.positions[player.position] || { emoji: '⚽' };
                    const jersey = player.jersey_number ? `#${player.jersey_number}` : '';
                    const age = player.age ? `(${player.age})` : '';

                    playersText += `${positionInfo.emoji} **${player.player_name}** ${flag} ${jersey}\n`;
                    playersText += `   ┗ ${player.position} ${age}\n`;
                }

                embed.addFields({
                    name: `🏟️ ${team}`,
                    value: playersText,
                    inline: true
                });
            }

            embed.addFields({
                name: '💡 نصائح للبحث',
                value: '• استخدم أسماء اللاعبين بالإنجليزية\n• جرب البحث بالفريق (مثل: Barcelona)\n• جرب البحث بالجنسية (مثل: Brazil)',
                inline: false
            });

            embed.setFooter({ text: '🔍 نتائج البحث • استخدم /add_player لإضافة لاعب' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in search_players command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء البحث عن اللاعبين. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر مقارنة اللاعبين
const comparePlayersCommand = {
    data: new SlashCommandBuilder()
        .setName('compare_players')
        .setDescription('مقارنة بين لاعبين')
        .addStringOption(option =>
            option.setName('player1')
                .setDescription('اسم اللاعب الأول')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('player2')
                .setDescription('اسم اللاعب الثاني')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const player1Name = interaction.options.getString('player1');
            const player2Name = interaction.options.getString('player2');

            // البحث عن اللاعبين
            const players1 = await database.searchPlayers(player1Name, 1);
            const players2 = await database.searchPlayers(player2Name, 1);

            if (players1.length === 0) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على اللاعب الأول: **${player1Name}**`,
                    '❌ لم يتم العثور على اللاعب'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            if (players2.length === 0) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على اللاعب الثاني: **${player2Name}**`,
                    '❌ لم يتم العثور على اللاعب'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const player1 = players1[0];
            const player2 = players2[0];

            const embed = EmbedUtils.createInfoEmbed(
                `⚔️ مقارنة: ${player1.player_name} 🆚 ${player2.player_name}`,
                '',
                config.colors.info
            );

            // معلومات اللاعب الأول
            const flag1 = HelperUtils.getCountryFlag(player1.nationality);
            const position1 = config.positions[player1.position] || { emoji: '⚽', arabic: player1.position };
            
            let player1Text = `${position1.emoji} **${player1.player_name}**\n`;
            player1Text += `🏟️ ${player1.team_name}\n`;
            player1Text += `🏳️ ${player1.nationality} ${flag1}\n`;
            if (player1.age) player1Text += `🎂 ${player1.age} سنة\n`;
            if (player1.jersey_number) player1Text += `👕 #${player1.jersey_number}\n`;
            if (player1.market_value) player1Text += `💰 ${player1.market_value}`;

            // معلومات اللاعب الثاني
            const flag2 = HelperUtils.getCountryFlag(player2.nationality);
            const position2 = config.positions[player2.position] || { emoji: '⚽', arabic: player2.position };
            
            let player2Text = `${position2.emoji} **${player2.player_name}**\n`;
            player2Text += `🏟️ ${player2.team_name}\n`;
            player2Text += `🏳️ ${player2.nationality} ${flag2}\n`;
            if (player2.age) player2Text += `🎂 ${player2.age} سنة\n`;
            if (player2.jersey_number) player2Text += `👕 #${player2.jersey_number}\n`;
            if (player2.market_value) player2Text += `💰 ${player2.market_value}`;

            embed.addFields(
                { name: `👤 ${player1.player_name}`, value: player1Text, inline: true },
                { name: '🆚', value: '\u200B', inline: true },
                { name: `👤 ${player2.player_name}`, value: player2Text, inline: true }
            );

            // مقارنة سريعة
            let comparisonText = '';
            
            // مقارنة العمر
            if (player1.age && player2.age) {
                const ageDiff = Math.abs(player1.age - player2.age);
                const younger = player1.age < player2.age ? player1.player_name : player2.player_name;
                comparisonText += `🎂 ${younger} أصغر بـ ${ageDiff} سنة\n`;
            }

            // مقارنة المركز
            if (player1.position === player2.position) {
                comparisonText += `⚽ نفس المركز: ${position1.arabic}\n`;
            } else {
                comparisonText += `⚽ مراكز مختلفة: ${position1.arabic} 🆚 ${position2.arabic}\n`;
            }

            // مقارنة الجنسية
            if (player1.nationality === player2.nationality) {
                comparisonText += `🏳️ نفس الجنسية: ${player1.nationality}\n`;
            } else {
                comparisonText += `🏳️ جنسيات مختلفة: ${player1.nationality} 🆚 ${player2.nationality}\n`;
            }

            if (comparisonText) {
                embed.addFields({
                    name: '📊 مقارنة سريعة',
                    value: comparisonText,
                    inline: false
                });
            }

            embed.addFields({
                name: '📈 الإحصائيات التفصيلية',
                value: '*سيتم إضافة إحصائيات مقارنة أكثر تفصيلاً قريباً*\n(أهداف، تمريرات، تدخلات، إلخ)',
                inline: false
            });

            embed.setFooter({ text: '⚔️ مقارنة اللاعبين • البوت الرياضي الاحترافي' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in compare_players command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء مقارنة اللاعبين. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// تصدير جميع الأوامر
module.exports = {
    addPlayer: addPlayerCommand,
    removePlayer: removePlayerCommand,
    myPlayers: myPlayersCommand,
    playerStats: playerStatsCommand,
    searchPlayers: searchPlayersCommand,
    comparePlayers: comparePlayersCommand
};