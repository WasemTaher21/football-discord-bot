const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { database } = require('../database/database');

const settingsCommand = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('إعدادات حسابك'),

    async execute(interaction, client) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ إعدادات حسابك')
                .setDescription('إعداداتك الحالية:')
                .setColor(0x0099ff)
                .addFields(
                    {
                        name: '⭐ عرض المفضلة فقط',
                        value: '✅ مفعل\n*عرض مباريات فرقك المفضلة فقط*',
                        inline: true
                    },
                    {
                        name: '🔔 التنبيهات',
                        value: '🔔 مفعل\n*تنبيهات مباريات فرقك المفضلة*',
                        inline: true
                    },
                    {
                        name: '🌍 اللغة',
                        value: '🇸🇦 العربية\n*اللغة المفضلة*',
                        inline: true
                    },
                    {
                        name: '🔧 تغيير الإعدادات',
                        value: '• `/settings show_only_favorites:False`\n• `/settings notifications:True`\n• `/settings language:en`',
                        inline: false
                    }
                )
                .setFooter({ text: 'استخدم /help للمزيد' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Settings error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في الإعدادات.',
                ephemeral: true
            });
        }
    }
};

const dashboardCommand = {
    data: new SlashCommandBuilder()
        .setName('my_dashboard')
        .setDescription('لوحة التحكم الشخصية'),

    async execute(interaction, client) {
        try {
            const embed = new EmbedBuilder()
                .setTitle(`🎯 لوحة التحكم - ${interaction.user.username}`)
                .setDescription('نظرة سريعة على حسابك:')
                .setColor(0x9966ff)
                .addFields(
                    {
                        name: '⚽ فرقك المفضلة (0)',
                        value: 'لم تضف أي فريق بعد\n`/add_team Real Madrid`',
                        inline: true
                    },
                    {
                        name: '🏃‍♂️ لاعبوك المفضلون (0)',
                        value: 'لم تضف أي لاعب بعد\n`/add_player Messi`',
                        inline: true
                    },
                    {
                        name: '⚙️ إعداداتك',
                        value: '✅ المفضلة فقط\n🔔 التنبيهات\n🇸🇦 اللغة',
                        inline: true
                    },
                    {
                        name: '⚡ أوامر سريعة',
                        value: '• `/matches` - مباريات اليوم\n• `/add_team` - إضافة فريق\n• `/help` - المساعدة',
                        inline: false
                    }
                )
                .setFooter({ text: 'لوحة التحكم الشخصية' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Dashboard error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في لوحة التحكم.',
                ephemeral: true
            });
        }
    }
};

const privacyCommand = {
    data: new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('معلومات الخصوصية'),

    async execute(interaction, client) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🔒 الخصوصية وحماية البيانات')
                .setDescription('معلومات مهمة حول بياناتك:')
                .setColor(0x9966ff)
                .addFields(
                    {
                        name: '📊 البيانات المحفوظة',
                        value: '• معرف Discord\n• الفرق المفضلة\n• اللاعبين المفضلين\n• الإعدادات الشخصية',
                        inline: false
                    },
                    {
                        name: '🔐 الأمان',
                        value: '• البيانات محفوظة محلياً\n• لا نشارك البيانات\n• يمكنك حذف بياناتك',
                        inline: false
                    }
                )
                .setFooter({ text: 'نحن نحترم خصوصيتك' });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Privacy error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ.',
                ephemeral: true
            });
        }
    }
};

module.exports = {
    settings: settingsCommand,
    dashboard: dashboardCommand,
    privacy: privacyCommand
};
