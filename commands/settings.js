const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const HelperUtils = require('../utils/helpers');
const { database } = require('../database/database');

// أمر إدارة إعدادات المستخدم (محسن)
const settingsCommand = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('إدارة إعدادات حسابك الشخصي')
        .addBooleanOption(option =>
            option.setName('show_only_favorites')
                .setDescription('عرض مباريات الفرق المفضلة فقط')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('notifications')
                .setDescription('تفعيل/إلغاء التنبيهات')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('اللغة المفضلة')
                .setRequired(false)
                .addChoices(
                    { name: 'العربية', value: 'ar' },
                    { name: 'English', value: 'en' }
                )),

    async execute(interaction, client) {
        try {
            // رد فوري لتجنب timeout
            await interaction.reply({
                content: '⚙️ جاري تحميل إعداداتك...',
                ephemeral: true
            });

            const userId = interaction.user.id;
            const showOnlyFavorites = interaction.options.getBoolean('show_only_favorites');
            const notifications = interaction.options.getBoolean('notifications');
            const language = interaction.options.getString('language');

            // جلب أو إنشاء إعدادات بشكل آمن
            let settings;
            try {
                settings = await database.getUserSettings(userId);
                if (!settings) {
                    // إنشاء إعدادات افتراضية
                    await database.run(`
                        INSERT OR IGNORE INTO user_settings 
                        (user_id, show_only_favorites, notifications_enabled, preferred_language)
                        VALUES (?, 1, 1, 'ar')
                    `, [userId]);
                    settings = {
                        show_only_favorites: true,
                        notifications_enabled: true,
                        preferred_language: 'ar'
                    };
                }
            } catch (error) {
                // إعدادات افتراضية في حالة فشل قاعدة البيانات
                settings = {
                    show_only_favorites: true,
                    notifications_enabled: true,
                    preferred_language: 'ar'
                };
            }

            // تحديث الإعدادات إذا تم تمرير قيم جديدة
            if (showOnlyFavorites !== null || notifications !== null || language !== null) {
                try {
                    const updates = {};
                    if (showOnlyFavorites !== null) updates.showOnlyFavorites = showOnlyFavorites;
                    if (notifications !== null) updates.notifications = notifications;
                    if (language !== null) updates.language = language;

                    if (Object.keys(updates).length > 0) {
                        await database.updateUserSettings(userId, updates);
                        // تحديث الإعدادات المحلية
                        if (showOnlyFavorites !== null) settings.show_only_favorites = showOnlyFavorites;
                        if (notifications !== null) settings.notifications_enabled = notifications;
                        if (language !== null) settings.preferred_language = language;
                    }
                } catch (error) {
                    console.log('Update settings error:', error);
                }
            }

            // إنشاء الـ embed
            const embed = EmbedUtils.createInfoEmbed(
                '⚙️ إعدادات حسابك',
                `مرحباً ${interaction.user.displayName}! هذه إعداداتك الحالية:`
            );

            const favoritesStatus = settings.show_only_favorites ? "✅ مفعل" : "❌ معطل";
            const notificationsStatus = settings.notifications_enabled ? "🔔 مفعل" : "🔕 معطل";
            const languageDisplay = settings.preferred_language === 'ar' ? "🇸🇦 العربية" : "🇬🇧 English";

            embed.addFields(
                {
                    name: '⭐ عرض المفضلة فقط',
                    value: `${favoritesStatus}\n*عرض مباريات فرقك المفضلة فقط*`,
                    inline: true
                },
                {
                    name: '🔔 التنبيهات',
                    value: `${notificationsStatus}\n*تنبيهات مباريات فرقك المفضلة*`,
                    inline: true
                },
                {
                    name: '🌍 اللغة المفضلة',
                    value: `${languageDisplay}\n*لغة المعلقين والقنوات*`,
                    inline: true
                }
            );

            // جلب إحصائيات بسيطة
            let teamCount = 0;
            let playerCount = 0;
            try {
                const teams = await database.all('SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ?', [userId]);
                const players = await database.all('SELECT COUNT(*) as count FROM user_favorite_players WHERE user_id = ?', [userId]);
                teamCount = teams[0]?.count || 0;
                playerCount = players[0]?.count || 0;
            } catch (error) {
                console.log('Stats error:', error);
            }

            embed.addFields(
                {
                    name: '📊 إحصائياتك',
                    value: `⭐ ${teamCount} فريق مفضل\n🏃‍♂️ ${playerCount} لاعب مفضل`,
                    inline: false
                },
                {
                    name: '🔧 تغيير الإعدادات',
                    value: '• `/settings show_only_favorites:False`\n• `/settings notifications:True`\n• `/settings language:en`',
                    inline: false
                }
            );

            embed.setFooter({ text: '💡 استخدم /help للمزيد من الأوامر' });

            await interaction.editReply({ 
                content: null,
                embeds: [embed] 
            });

        } catch (error) {
            console.error('Settings command error:', error);
            try {
                await interaction.editReply({
                    content: '❌ حدث خطأ في الإعدادات. جرب مرة أخرى لاحقاً.',
                    embeds: []
                });
            } catch (e) {
                console.error('Error editing reply:', e);
            }
        }
    }
};

// أمر لوحة التحكم (محسن)
const dashboardCommand = {
    data: new SlashCommandBuilder()
        .setName('my_dashboard')
        .setDescription('لوحة التحكم الشخصية'),

    async execute(interaction, client) {
        try {
            await interaction.reply({
                content: '🎯 جاري تحميل لوحة التحكم...',
                ephemeral: true
            });

            const userId = interaction.user.id;

            // جلب البيانات بشكل متوازي وآمن
            let favoriteTeams = [];
            let favoritePlayers = [];
            let settings = null;

            try {
                const [teams, players, userSettings] = await Promise.allSettled([
                    database.getUserFavoriteTeams(userId),
                    database.getUserFavoritePlayers(userId),
                    database.getUserSettings(userId)
                ]);

                favoriteTeams = teams.status === 'fulfilled' ? teams.value : [];
                favoritePlayers = players.status === 'fulfilled' ? players.value : [];
                settings = userSettings.status === 'fulfilled' ? userSettings.value : null;
            } catch (error) {
                console.log('Dashboard data error:', error);
            }

            const embed = EmbedUtils.createInfoEmbed(
                `🎯 لوحة التحكم - ${interaction.user.displayName}`,
                'مرحباً! هذه نظرة سريعة على حسابك:'
            );

            // عرض الفرق المفضلة
            if (favoriteTeams.length > 0) {
                let teamsText = '';
                const displayTeams = favoriteTeams.slice(0, 3);
                
                for (const team of displayTeams) {
                    const flag = HelperUtils.getCountryFlag(team.country || 'default');
                    teamsText += `⭐ ${team.team_name} ${flag}\n`;
                }

                if (favoriteTeams.length > 3) {
                    teamsText += `... و ${favoriteTeams.length - 3} فرق أخرى`;
                }

                embed.addFields({
                    name: `⚽ فرقك المفضلة (${favoriteTeams.length})`,
                    value: teamsText,
                    inline: true
                });
            } else {
                embed.addFields({
                    name: '⚽ فرقك المفضلة (0)',
                    value: 'لم تضف أي فريق بعد\n`/add_team Real Madrid`',
                    inline: true
                });
            }

            // عرض اللاعبين المفضلين
            if (favoritePlayers.length > 0) {
                let playersText = '';
                const displayPlayers = favoritePlayers.slice(0, 3);
                
                for (const player of displayPlayers) {
                    const flag = HelperUtils.getCountryFlag(player.nationality || 'default');
                    playersText += `🏃‍♂️ ${player.player_name} ${flag}\n`;
                }

                if (favoritePlayers.length > 3) {
                    playersText += `... و ${favoritePlayers.length - 3} لاعبين آخرين`;
                }

                embed.addFields({
                    name: `🏃‍♂️ لاعبوك المفضلون (${favoritePlayers.length})`,
                    value: playersText,
                    inline: true
                });
            } else {
                embed.addFields({
                    name: '🏃‍♂️ لاعبوك المفضلون (0)',
                    value: 'لم تضف أي لاعب بعد\n`/add_player Messi`',
                    inline: true
                });
            }

            // عرض الإعدادات
            if (settings) {
                const favoritesOnly = settings.show_only_favorites ? "✅" : "❌";
                const notifications = settings.notifications_enabled ? "🔔" : "🔕";
                const language = settings.preferred_language === 'ar' ? "🇸🇦" : "🇬🇧";

                embed.addFields({
                    name: '⚙️ إعداداتك',
                    value: `${favoritesOnly} المفضلة فقط\n${notifications} التنبيهات\n${language} اللغة`,
                    inline: true
                });
            }

            // الأوامر السريعة
            embed.addFields({
                name: '⚡ أوامر سريعة',
                value: '• `/matches` - مباريات اليوم\n• `/add_team` - إضافة فريق\n• `/help` - المساعدة',
                inline: false
            });

            embed.setFooter({ text: '💡 لوحة التحكم الشخصية' });

            await interaction.editReply({ 
                content: null,
                embeds: [embed] 
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            try {
                await interaction.editReply({
                    content: '❌ حدث خطأ في لوحة التحكم. جرب مرة أخرى لاحقاً.',
                    embeds: []
                });
            } catch (e) {
                console.error('Error editing reply:', e);
            }
        }
    }
};

// أمر إعادة تعيين البيانات (مبسط)
const resetDataCommand = {
    data: new SlashCommandBuilder()
        .setName('reset_data')
        .setDescription('إعادة تعيين جميع بياناتك')
        .addStringOption(option =>
            option.setName('confirmation')
                .setDescription('اكتب "تأكيد" لحذف جميع البيانات')
                .setRequired(true)),

    async execute(interaction, client) {
        try {
            const confirmation = interaction.options.getString('confirmation');
            const userId = interaction.user.id;

            if (confirmation !== 'تأكيد' && confirmation !== 'confirm') {
                return await interaction.reply({
                    content: '⚠️ لم يتم التأكيد. اكتب "تأكيد" للمتابعة.',
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: '🗑️ جاري حذف البيانات...',
                ephemeral: true
            });

            // حذف البيانات
            try {
                await database.run('DELETE FROM user_favorites WHERE user_id = ?', [userId]);
                await database.run('DELETE FROM user_favorite_players WHERE user_id = ?', [userId]);
                await database.run('DELETE FROM user_settings WHERE user_id = ?', [userId]);
            } catch (error) {
                console.log('Delete error:', error);
            }

            const embed = EmbedUtils.createSuccessEmbed(
                '✅ تم حذف جميع بياناتك بنجاح!\n\n• الفرق المفضلة ❌\n• اللاعبين المفضلين ❌\n• الإعدادات ❌\n\n💡 يمكنك البدء من جديد باستخدام `/add_team`',
                '🗑️ إعادة تعيين البيانات'
            );

            await interaction.editReply({ 
                content: null,
                embeds: [embed] 
            });

        } catch (error) {
            console.error('Reset data error:', error);
            try {
                await interaction.editReply({
                    content: '❌ حدث خطأ أثناء حذف البيانات.',
                    embeds: []
                });
            } catch (e) {
                console.error('Error editing reply:', e);
            }
        }
    }
};

// أمر الخصوصية (مبسط)
const privacyCommand = {
    data: new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('معلومات الخصوصية وحماية البيانات'),

    async execute(interaction, client) {
        try {
            const embed = EmbedUtils.createInfoEmbed(
                '🔒 الخصوصية وحماية البيانات',
                'معلومات مهمة حول بياناتك:'
            );

            embed.addFields(
                {
                    name: '📊 البيانات المحفوظة',
                    value: '• معرف Discord الخاص بك\n• الفرق والاعبين المفضلين\n• الإعدادات الشخصية\n• لا نحفظ الرسائل الخاصة',
                    inline: false
                },
                {
                    name: '🔐 الأمان',
                    value: '• البيانات محفوظة محلياً\n• لا نشارك البيانات مع الغير\n• يمكنك حذف بياناتك متى شئت',
                    inline: false
                },
                {
                    name: '🛠️ التحكم في البيانات',
                    value: '• `/reset_data` - حذف جميع البيانات\n• `/settings` - تحديث الإعدادات\n• `/privacy` - معلومات الخصوصية',
                    inline: false
                }
            );

            embed.setFooter({ text: '🔒 نحن نحترم خصوصيتك' });

            await interaction.reply({ 
                embeds: [embed],
                ephemeral: true 
            });

        } catch (error) {
            console.error('Privacy error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في عرض معلومات الخصوصية.',
                ephemeral: true
            });
        }
    }
};

// تصدير جميع الأوامر
module.exports = {
    settings: settingsCommand,
    dashboard: dashboardCommand,
    resetData: resetDataCommand,
    privacy: privacyCommand
};
