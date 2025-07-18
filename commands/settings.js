const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const HelperUtils = require('../utils/helpers');
const { database } = require('../database/database');
const config = require('../config/config');

// أمر إدارة إعدادات المستخدم
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
                .setDescription('اللغة المفضلة للمعلقين والقنوات')
                .setRequired(false)
                .addChoices(
                    { name: 'العربية', value: 'ar' },
                    { name: 'English', value: 'en' }
                )),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;
            const showOnlyFavorites = interaction.options.getBoolean('show_only_favorites');
            const notifications = interaction.options.getBoolean('notifications');
            const language = interaction.options.getString('language');

            // إنشاء إعدادات افتراضية إذا لم تكن موجودة
            let settings = await database.getUserSettings(userId);

            // تحديث الإعدادات إذا تم تمرير قيم جديدة
            const updates = {};
            
            if (showOnlyFavorites !== null) {
                updates.showOnlyFavorites = showOnlyFavorites;
            }
            
            if (notifications !== null) {
                updates.notifications = notifications;
            }
            
            if (language !== null) {
                updates.language = language;
            }

            if (Object.keys(updates).length > 0) {
                await database.updateUserSettings(userId, updates);
            }

            // جلب الإعدادات المحدثة
            settings = await database.getUserSettings(userId);

            const embed = EmbedUtils.createInfoEmbed(
                '⚙️ إعدادات حسابك',
                '',
                0x0099ff
            );

            const favoritesStatus = settings.show_only_favorites ? "✅ مفعل" : "❌ معطل";
            const notificationsStatus = settings.notifications_enabled ? "🔔 مفعل" : "🔕 معطل";
            const languageDisplay = settings.preferred_language === 'ar' ? "🇸🇦 العربية" : "🇬🇧 English";

            embed.addFields(
                {
                    name: '⭐ عرض الفرق المفضلة فقط',
                    value: `${favoritesStatus}\n*عرض مباريات فرقك المفضلة فقط بشكل افتراضي*`,
                    inline: false
                },
                {
                    name: '🔔 التنبيهات',
                    value: `${notificationsStatus}\n*تنبيهات مباريات فرقك المفضلة*`,
                    inline: false
                },
                {
                    name: '🌍 اللغة المفضلة',
                    value: `${languageDisplay}\n*لغة المعلقين والقنوات المفضلة*`,
                    inline: false
                }
            );

            embed.addFields({
                name: '🔧 تغيير الإعدادات',
                value: 'استخدم الأمر مع المعاملات:\n• `/settings show_only_favorites:False`\n• `/settings notifications:True`\n• `/settings language:en`',
                inline: false
            });

            // إضافة إحصائيات
            const favoriteTeams = await database.getUserFavoriteTeams(userId);
            const favoritePlayers = await database.getUserFavoritePlayers(userId);

            embed.addFields({
                name: '📊 إحصائياتك',
                value: `⭐ ${favoriteTeams.length} فريق مفضل\n🏃‍♂️ ${favoritePlayers.length} لاعب مفضل`,
                inline: false
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in settings command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء إدارة الإعدادات. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر لوحة التحكم الشخصية
const dashboardCommand = {
    data: new SlashCommandBuilder()
        .setName('my_dashboard')
        .setDescription('لوحة التحكم الشخصية'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const userId = interaction.user.id;

            // جلب الفرق المفضلة
            const favoriteTeams = await database.getUserFavoriteTeams(userId);

            // جلب اللاعبين المفضلين
            const favoritePlayers = await database.getUserFavoritePlayers(userId);

            // جلب إعدادات المستخدم
            const settings = await database.getUserSettings(userId);

            const embed = EmbedUtils.createInfoEmbed(
                `🎯 لوحة التحكم - ${interaction.user.displayName}`,
                '',
                0x9966ff
            );

            // الفرق المفضلة
            if (favoriteTeams.length > 0) {
                let teamsText = '';
                const displayTeams = favoriteTeams.slice(0, 3); // أول 3 فرق
                
                for (const team of displayTeams) {
                    const flag = HelperUtils.getCountryFlag(team.country);
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
                    value: 'لم تضف أي فريق بعد\n`/add_team [اسم الفريق]`',
                    inline: true
                });
            }

            // اللاعبين المفضلين
            if (favoritePlayers.length > 0) {
                let playersText = '';
                const displayPlayers = favoritePlayers.slice(0, 3); // أول 3 لاعبين
                
                for (const player of displayPlayers) {
                    const flag = HelperUtils.getCountryFlag(player.nationality);
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
                    value: 'لم تضف أي لاعب بعد\n`/add_player [اسم اللاعب]`',
                    inline: true
                });
            }

            // الإعدادات
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

            // المباريات القادمة للفرق المفضلة
            if (favoriteTeams.length > 0) {
                try {
                    const today = HelperUtils.getTodayDate();
                    const endDate = HelperUtils.getDateAfterDays(3);
                    
                    const data = await HelperUtils.makeAPIRequest(`/matches?dateFrom=${today}&dateTo=${endDate}`);
                    
                    if (!data.error) {
                        const matches = data.matches || [];
                        const upcomingFavoriteMatches = await HelperUtils.filterMatchesByFavorites(matches, userId);

                        if (upcomingFavoriteMatches.length > 0) {
                            const nextMatch = upcomingFavoriteMatches[0];
                            const homeTeam = nextMatch.homeTeam.name;
                            const awayTeam = nextMatch.awayTeam.name;
                            const matchTime = new Date(nextMatch.utcDate);
                            const timestamp = Math.floor(matchTime.getTime() / 1000);

                            embed.addFields({
                                name: '🔥 مباراتك القادمة',
                                value: `⚽ ${homeTeam} 🆚 ${awayTeam}\n🕐 <t:${timestamp}:R>\n🏆 ${nextMatch.competition.name}`,
                                inline: false
                            });
                        } else {
                            embed.addFields({
                                name: '📅 مباراتك القادمة',
                                value: 'لا توجد مباريات لفرقك المفضلة في الأيام القليلة القادمة',
                                inline: false
                            });
                        }
                    }
                } catch (error) {
                    // تجاهل الأخطاء في جلب المباريات القادمة
                }
            }

            // الأوامر السريعة
            embed.addFields({
                name: '⚡ أوامر سريعة',
                value: '• `/matches` - مباريات اليوم\n• `/my_teams` - فرقك المفضلة\n• `/my_players` - لاعبوك المفضلون\n• `/settings` - إعداداتك',
                inline: false
            });

            embed.setFooter({ text: '💡 لوحة التحكم الشخصية • محدثة الآن' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in dashboard command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب لوحة التحكم. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إعادة تعيين البيانات
const resetDataCommand = {
    data: new SlashCommandBuilder()
        .setName('reset_data')
        .setDescription('إعادة تعيين جميع بياناتك (غير قابل للتراجع!)')
        .addStringOption(option =>
            option.setName('confirmation')
                .setDescription('اكتب "تأكيد" لإعادة التعيين')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const confirmation = interaction.options.getString('confirmation');
            const userId = interaction.user.id;

            if (confirmation !== 'تأكيد' && confirmation !== 'confirm') {
                const embed = EmbedUtils.createWarningEmbed(
                    'لم يتم تأكيد العملية. اكتب "تأكيد" للمتابعة.',
                    '⚠️ لم يتم التأكيد'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // حذف جميع البيانات
            await database.run('DELETE FROM user_favorites WHERE user_id = ?', [userId]);
            await database.run('DELETE FROM user_favorite_players WHERE user_id = ?', [userId]);
            await database.run('DELETE FROM user_settings WHERE user_id = ?', [userId]);
            await database.run('DELETE FROM match_notifications WHERE user_id = ?', [userId]);

            const embed = EmbedUtils.createSuccessEmbed(
                'تم حذف جميع بياناتك بنجاح.\n\n• الفرق المفضلة ❌\n• اللاعبين المفضلين ❌\n• الإعدادات الشخصية ❌\n• التنبيهات ❌\n\nيمكنك البدء من جديد باستخدام `/add_team` و `/add_player`',
                '🗑️ تم إعادة تعيين البيانات'
            );

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in reset_data command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء إعادة تعيين البيانات. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر تصدير البيانات
const exportDataCommand = {
    data: new SlashCommandBuilder()
        .setName('export_data')
        .setDescription('تصدير بياناتك الشخصية'),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const userId = interaction.user.id;

            // جلب جميع البيانات
            const favoriteTeams = await database.getUserFavoriteTeams(userId);
            const favoritePlayers = await database.getUserFavoritePlayers(userId);
            const settings = await database.getUserSettings(userId);

            // إنشاء ملف JSON
            const userData = {
                user_id: userId,
                username: interaction.user.username,
                export_date: new Date().toISOString(),
                favorite_teams: favoriteTeams,
                favorite_players: favoritePlayers,
                settings: settings
            };

            const jsonData = JSON.stringify(userData, null, 2);

            // إنشاء embed مع ملخص البيانات
            const embed = EmbedUtils.createInfoEmbed(
                '📁 تصدير البيانات',
                'تم تجهيز بياناتك للتصدير',
                0x0099ff
            );

            embed.addFields(
                { name: '⭐ الفرق المفضلة', value: `${favoriteTeams.length} فريق`, inline: true },
                { name: '🏃‍♂️ اللاعبين المفضلين', value: `${favoritePlayers.length} لاعب`, inline: true },
                { name: '⚙️ الإعدادات', value: settings ? 'محفوظة' : 'افتراضية', inline: true }
            );

            embed.addFields({
                name: '💾 ملف البيانات',
                value: '```json\n' + jsonData.substring(0, 500) + (jsonData.length > 500 ? '...\n```' : '\n```'),
                inline: false
            });

            embed.addFields({
                name: '💡 ملاحظة',
                value: 'يمكنك نسخ البيانات وحفظها كملف JSON لاستخدامها لاحقاً',
                inline: false
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in export_data command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر الخصوصية
const privacyCommand = {
    data: new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('معلومات الخصوصية وحماية البيانات'),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const embed = EmbedUtils.createInfoEmbed(
                '🔒 الخصوصية وحماية البيانات',
                'معلومات هامة حول بياناتك الشخصية',
                0x9966ff
            );

            embed.addFields(
                {
                    name: '📊 البيانات المحفوظة',
                    value: '• معرف المستخدم في Discord\n• الفرق المفضلة\n• اللاعبين المفضلين\n• الإعدادات الشخصية\n• لا نحفظ الرسائل الشخصية',
                    inline: false
                },
                {
                    name: '🔐 الأمان',
                    value: '• البيانات محفوظة محلياً\n• لا نشارك البيانات مع أطراف ثالثة\n• يمكنك حذف بياناتك في أي وقت\n• التشفير المحلي للبيانات الحساسة',
                    inline: false
                },
                {
                    name: '🛠️ التحكم في البيانات',
                    value: '• `/export_data` - تصدير بياناتك\n• `/reset_data` - حذف جميع البيانات\n• `/settings` - تحديث إعداداتك\n• `/privacy` - معلومات الخصوصية',
                    inline: false
                },
                {
                    name: '📧 الاتصال',
                    value: 'إذا كان لديك أي استفسارات حول الخصوصية، يمكنك التواصل مع إدارة الخادم',
                    inline: false
                }
            );

            embed.setFooter({ text: '🔒 نحن نحترم خصوصيتك ونحمي بياناتك' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in privacy command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء عرض معلومات الخصوصية. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// تصدير جميع الأوامر
module.exports = {
    settings: settingsCommand,
    dashboard: dashboardCommand,
    resetData: resetDataCommand,
    exportData: exportDataCommand,
    privacy: privacyCommand
};
