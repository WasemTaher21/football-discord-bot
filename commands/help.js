const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const config = require('../config/config');

// أمر المساعدة الرئيسي
const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('دليل استخدام البوت الشامل')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('رقم الصفحة (1-3)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(3)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const page = interaction.options.getInteger('page') || 1;

            // إنشاء الـ embeds للصفحات المختلفة
            const embeds = [
                // الصفحة الأولى - الأوامر الأساسية
                EmbedUtils.createInfoEmbed(
                    '📚 دليل البوت الرياضي الاحترافي',
                    'مرحباً بك في أقوى بوت رياضي على ديسكورد! 🏆',
                    config.colors.success
                )
                .addFields(
                    {
                        name: '⚽ أوامر المباريات الأساسية',
                        value: '• `/matches` - مباريات اليوم (فرقك المفضلة)\n• `/matches show_all:True` - جميع مباريات اليوم\n• `/tomorrow` - مباريات الغد\n• `/upcoming [أيام]` - المباريات القادمة\n• `/live` - المباريات المباشرة\n• `/team_matches [فريق]` - مباريات فريق معين',
                        inline: false
                    },
                    {
                        name: '📺 معلومات البث والتعليق',
                        value: '• `/channels [بطولة]` - القنوات العارضة\n• `/commentators [بطولة]` - أفضل المعلقين\n• `/free_matches` - المباريات المجانية اليوم\n• `/match_details [فريق1] [فريق2]` - تفاصيل مباراة',
                        inline: false
                    }
                )
                .setFooter({ text: 'الصفحة 1/3 • استخدم الأزرار للتنقل' }),

                // الصفحة الثانية - إدارة المفضلة
                EmbedUtils.createInfoEmbed(
                    '⭐ إدارة المفضلة',
                    '',
                    config.colors.warning
                )
                .addFields(
                    {
                        name: '🏟️ إدارة الفرق المفضلة',
                        value: '• `/add_team [اسم الفريق]` - إضافة فريق للمفضلة\n• `/remove_team [اسم الفريق]` - إزالة فريق\n• `/my_teams` - عرض فرقك المفضلة\n• `/team_matches [فريق]` - مباريات فريق معين\n• `/team_stats [فريق]` - إحصائيات فريق\n• `/search_teams [بحث]` - البحث عن فرق',
                        inline: false
                    },
                    {
                        name: '🏃‍♂️ إدارة اللاعبين المفضلين',
                        value: '• `/add_player [اسم اللاعب]` - إضافة لاعب للمفضلة\n• `/remove_player [اسم اللاعب]` - إزالة لاعب\n• `/my_players` - عرض لاعبيك المفضلين\n• `/player_stats [اسم اللاعب]` - إحصائيات لاعب\n• `/search_players [بحث]` - البحث عن لاعبين\n• `/compare_players [لاعب1] [لاعب2]` - مقارنة لاعبين',
                        inline: false
                    },
                    {
                        name: '💡 فوائد نظام المفضلة',
                        value: '✅ عرض مباريات فرقك المفضلة فقط\n⭐ تمييز الفرق المفضلة بالنجوم\n🔔 تنبيهات مخصصة للمباريات\n📊 إحصائيات شخصية متقدمة',
                        inline: false
                    }
                )
                .setFooter({ text: 'الصفحة 2/3 • استخدم الأزرار للتنقل' }),

                // الصفحة الثالثة - الإعدادات والأوامر المتقدمة
                EmbedUtils.createInfoEmbed(
                    '⚙️ الإعدادات والأوامر المتقدمة',
                    '',
                    config.colors.info
                )
                .addFields(
                    {
                        name: '🎛️ إعدادات الحساب',
                        value: '• `/settings` - عرض إعداداتك الحالية\n• `/settings show_only_favorites:False` - عرض جميع المباريات\n• `/settings notifications:True` - تفعيل التنبيهات\n• `/settings language:en` - تغيير اللغة المفضلة\n• `/my_dashboard` - لوحة التحكم الشخصية\n• `/reset_data` - إعادة تعيين البيانات\n• `/export_data` - تصدير البيانات\n• `/privacy` - معلومات الخصوصية',
                        inline: false
                    },
                    {
                        name: '📊 أوامر الإحصائيات',
                        value: '• `/league_standings [دوري]` - ترتيب الدوري\n• `/match_stats [match_id]` - إحصائيات مباراة\n• `/user_stats` - إحصائياتك المفصلة\n• `/predict_match [فريق1] [فريق2]` - توقع مباراة\n• `/server_stats` - إحصائيات الخادم (للمدراء)',
                        inline: false
                    },
                    {
                        name: '🏆 مميزات البوت',
                        value: '🔴 تحديث مباشر كل دقيقتين\n📺 معلومات القنوات والمعلقين\n🆓 تمييز المباريات المجانية\n⭐ نظام مفضلة متقدم\n🌍 دعم متعدد اللغات\n📱 واجهة سهلة الاستخدام\n🔒 حماية البيانات والخصوصية',
                        inline: false
                    }
                )
                .setFooter({ text: 'الصفحة 3/3 • البوت الرياضي الاحترافي' })
            ];

            // إنشاء الأزرار للتنقل
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_prev')
                        .setLabel('الصفحة السابقة')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬅️')
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId('help_next')
                        .setLabel('الصفحة التالية')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('➡️')
                        .setDisabled(page === 3),
                    new ButtonBuilder()
                        .setCustomId('help_quick_start')
                        .setLabel('البداية السريعة')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🚀')
                );

            await interaction.followUp({
                embeds: [embeds[page - 1]],
                components: [row]
            });

        } catch (error) {
            console.error('Error in help command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء عرض دليل المساعدة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر البداية السريعة
const quickStartCommand = {
    data: new SlashCommandBuilder()
        .setName('quick_start')
        .setDescription('دليل البداية السريعة للمستخدمين الجدد'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const embed = EmbedUtils.createQuickStartEmbed();

            // إنشاء أزرار للأوامر السريعة
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('quick_add_team')
                        .setLabel('إضافة فريق')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('⚽'),
                    new ButtonBuilder()
                        .setCustomId('quick_add_player')
                        .setLabel('إضافة لاعب')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🏃‍♂️'),
                    new ButtonBuilder()
                        .setCustomId('quick_matches')
                        .setLabel('مباريات اليوم')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('📅'),
                    new ButtonBuilder()
                        .setCustomId('quick_help')
                        .setLabel('دليل كامل')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📚')
                );

            await interaction.followUp({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Error in quick_start command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء عرض دليل البداية السريعة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر معلومات البوت
const aboutCommand = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('معلومات حول البوت الرياضي'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const embed = EmbedUtils.createInfoEmbed(
                '🤖 حول البوت الرياضي الاحترافي',
                'البوت الأكثر تطوراً لمتابعة كرة القدم على ديسكورد',
                config.colors.primary
            );

            // معلومات البوت
            const botStats = {
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                uptime: Math.floor(client.uptime / (1000 * 60 * 60 * 24)), // أيام
                ping: Math.round(client.ws.ping)
            };

            embed.addFields(
                {
                    name: '📊 إحصائيات البوت',
                    value: `🏠 **${botStats.guilds}** خادم\n👥 **${botStats.users}** مستخدم\n⏰ **${botStats.uptime}** يوم تشغيل\n📡 **${botStats.ping}ms** ping`,
                    inline: true
                },
                {
                    name: '🏆 المميزات الرئيسية',
                    value: '⚽ متابعة مباريات مباشرة\n📺 معلومات القنوات والمعلقين\n⭐ نظام مفضلة ذكي\n🔔 تنبيهات مخصصة\n📊 إحصائيات متقدمة\n🌍 دعم عربي وإنجليزي',
                    inline: true
                },
                {
                    name: '🔧 التقنيات المستخدمة',
                    value: '• **Node.js** - منصة التشغيل\n• **Discord.js v14** - مكتبة ديسكورد\n• **SQLite** - قاعدة البيانات\n• **Football-Data API** - بيانات المباريات\n• **Axios** - طلبات HTTP',
                    inline: false
                },
                {
                    name: '📈 الإصدار والتحديثات',
                    value: `🔢 **الإصدار:** v2.0.0\n📅 **آخر تحديث:** ${new Date().toLocaleDateString('ar-SA')}\n🆕 **الجديد:** نظام المفضلة المتقدم، معلومات البث، إحصائيات تفاعلية`,
                    inline: false
                },
                {
                    name: '🎯 الهدف',
                    value: 'توفير تجربة متكاملة ومخصصة لمحبي كرة القدم مع التركيز على البساطة والكفاءة',
                    inline: false
                },
                {
                    name: '🚀 بدء الاستخدام',
                    value: '• استخدم `/quick_start` للبداية السريعة\n• استخدم `/help` للدليل الكامل\n• استخدم `/add_team` لإضافة فريقك المفضل',
                    inline: false
                }
            );

            embed.setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }));
            embed.setFooter({ 
                text: `${client.user.username} • البوت الرياضي الاحترافي`,
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in about command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء عرض معلومات البوت. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر الأسئلة الشائعة
const faqCommand = {
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription('الأسئلة الشائعة حول البوت'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const embed = EmbedUtils.createInfoEmbed(
                '❓ الأسئلة الشائعة',
                'إجابات على الأسئلة الأكثر شيوعاً حول البوت الرياضي',
                config.colors.info
            );

            embed.addFields(
                {
                    name: '❓ كيف أضيف فريقي المفضل؟',
                    value: 'استخدم الأمر `/add_team [اسم الفريق]` مثل `/add_team Real Madrid`\nيمكنك إضافة عدة فرق وستظهر مبارياتها تلقائياً.',
                    inline: false
                },
                {
                    name: '❓ لماذا لا أرى جميع المباريات؟',
                    value: 'البوت يعرض مباريات فرقك المفضلة فقط بشكل افتراضي.\nاستخدم `/matches show_all:True` لعرض جميع المباريات، أو `/settings show_only_favorites:False` لتغيير الإعداد.',
                    inline: false
                },
                {
                    name: '❓ كيف أعرف القنوات العارضة للمباريات؟',
                    value: 'كل مباراة تظهر مع معلومات القنوات العارضة والمعلقين تلقائياً.\nيمكنك أيضاً استخدام `/channels [البطولة]` للحصول على قائمة كاملة.',
                    inline: false
                },
                {
                    name: '❓ هل البوت يدعم الدوري السعودي؟',
                    value: 'نعم! البوت يدعم الدوري السعودي والفرق السعودية مثل الهلال والنصر والأهلي والاتحاد.\nكما يدعم اللاعبين السعوديين والعرب.',
                    inline: false
                },
                {
                    name: '❓ كيف أحصل على تنبيهات للمباريات؟',
                    value: 'التنبيهات مفعلة تلقائياً لفرقك المفضلة.\nيمكنك التحكم فيها عبر `/settings notifications:True/False`.',
                    inline: false
                },
                {
                    name: '❓ ما هي المباريات المجانية؟',
                    value: 'استخدم `/free_matches` لمعرفة المباريات المتاحة على قنوات مجانية اليوم.\nالبوت يميز المباريات المجانية برمز 🆓.',
                    inline: false
                },
                {
                    name: '❓ هل يمكنني مقارنة اللاعبين؟',
                    value: 'نعم! استخدم `/compare_players [لاعب1] [لاعب2]` لمقارنة أي لاعبين.\nمثال: `/compare_players Ronaldo Messi`',
                    inline: false
                },
                {
                    name: '❓ كيف أحذف بياناتي؟',
                    value: 'استخدم `/reset_data` مع كتابة "تأكيد" لحذف جميع بياناتك.\nيمكنك أيضاً تصدير بياناتك أولاً باستخدام `/export_data`.',
                    inline: false
                },
                {
                    name: '❓ البوت لا يستجيب؟',
                    value: 'تأكد من استخدام `/` قبل الأوامر (Slash Commands).\nإذا استمرت المشكلة، تواصل مع إدارة الخادم.',
                    inline: false
                }
            );

            embed.addFields({
                name: '💡 نصائح إضافية',
                value: '• استخدم `/quick_start` إذا كنت مستخدم جديد\n• استخدم `/help` للدليل الكامل\n• استخدم `/about` لمعرفة المزيد عن البوت\n• جرب `/predict_match` للمتعة والتسلية!',
                inline: false
            });

            embed.setFooter({ text: '💬 هل لديك سؤال آخر؟ تواصل مع إدارة الخادم' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in faq command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء عرض الأسئلة الشائعة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر الدعم
const supportCommand = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('معلومات الدعم والمساعدة'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const embed = EmbedUtils.createInfoEmbed(
                '🛟 الدعم والمساعدة',
                'نحن هنا لمساعدتك في استخدام البوت الرياضي',
                config.colors.success
            );

            embed.addFields(
                {
                    name: '📚 موارد التعلم',
                    value: '• `/help` - دليل البوت الكامل\n• `/quick_start` - البداية السريعة\n• `/faq` - الأسئلة الشائعة\n• `/about` - معلومات البوت',
                    inline: false
                },
                {
                    name: '🔧 حل المشاكل الشائعة',
                    value: '• **البوت لا يستجيب:** تأكد من استخدام `/` قبل الأوامر\n• **لا أرى مباريات:** أضف فرقك المفضلة بـ `/add_team`\n• **مشاكل في الإعدادات:** استخدم `/settings` للتحقق\n• **بيانات خاطئة:** استخدم `/reset_data` لإعادة البدء',
                    inline: false
                },
                {
                    name: '📊 تشخيص المشاكل',
                    value: '• `/my_dashboard` - تحقق من إعداداتك\n• `/user_stats` - راجع إحصائياتك\n• `/export_data` - احفظ نسخة من بياناتك\n• `/privacy` - معلومات الخصوصية',
                    inline: false
                },
                {
                    name: '💡 نصائح للاستخدام الأمثل',
                    value: '• أضف 3-5 فرق مفضلة للحصول على تغطية جيدة\n• فعل التنبيهات للحصول على إشعارات المباريات\n• استخدم الأوامر المتقدمة للإحصائيات\n• جرب المقارنات والتوقعات للمتعة',
                    inline: false
                },
                {
                    name: '🐛 الإبلاغ عن المشاكل',
                    value: 'إذا واجهت مشكلة تقنية:\n• أخبر إدارة الخادم بتفاصيل المشكلة\n• اذكر الأمر المستخدم ووقت حدوث المشكلة\n• أرفق لقطة شاشة إذا أمكن',
                    inline: false
                },
                {
                    name: '✨ طلب ميزات جديدة',
                    value: 'لديك فكرة لتحسين البوت؟\n• تواصل مع إدارة الخادم\n• اقترح الميزات الجديدة\n• شارك في تطوير البوت',
                    inline: false
                }
            );

            embed.addFields({
                name: '🎯 أهدافنا',
                value: 'نسعى لتوفير أفضل تجربة رياضية على ديسكورد\nملاحظاتك واقتراحاتك تساعدنا على التحسين المستمر',
                inline: false
            });

            embed.setFooter({ text: '🤝 شكراً لاستخدامك البوت الرياضي الاحترافي' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in support command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء عرض معلومات الدعم. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// تصدير جميع الأوامر
module.exports = {
    help: helpCommand,
    quickStart: quickStartCommand,
    about: aboutCommand,
    faq: faqCommand,
    support: supportCommand
};