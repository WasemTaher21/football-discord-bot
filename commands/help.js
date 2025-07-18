const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');

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

            if (page === 1) {
                const embed = EmbedUtils.createInfoEmbed(
                    '📚 دليل البوت الرياضي',
                    'مرحباً بك في أقوى بوت رياضي! 🏆'
                );
                
                embed.addFields(
                    {
                        name: '⚽ أوامر المباريات',
                        value: '• `/matches` - مباريات اليوم\n• `/live` - المباريات المباشرة\n• `/tomorrow` - مباريات الغد\n• `/upcoming` - المباريات القادمة',
                        inline: false
                    },
                    {
                        name: '📺 معلومات البث',
                        value: '• `/channels` - القنوات العارضة\n• `/free_matches` - المباريات المجانية\n• `/commentators` - أفضل المعلقين',
                        inline: false
                    }
                );
                
                embed.setFooter({ text: 'الصفحة 1/3 • استخدم /help page:2 للتالي' });
                return await interaction.followUp({ embeds: [embed] });
            }

            if (page === 2) {
                const embed = EmbedUtils.createInfoEmbed(
                    '⭐ إدارة المفضلة',
                    'أضف فرقك ولاعبيك المفضلين'
                );
                
                embed.addFields(
                    {
                        name: '🏟️ الفرق المفضلة',
                        value: '• `/add_team` - إضافة فريق\n• `/remove_team` - إزالة فريق\n• `/my_teams` - عرض فرقك\n• `/team_matches` - مباريات فريق',
                        inline: false
                    },
                    {
                        name: '🏃‍♂️ اللاعبين المفضلين',
                        value: '• `/add_player` - إضافة لاعب\n• `/remove_player` - إزالة لاعب\n• `/my_players` - عرض لاعبيك\n• `/player_stats` - إحصائيات لاعب',
                        inline: false
                    }
                );
                
                embed.setFooter({ text: 'الصفحة 2/3 • استخدم /help page:3 للتالي' });
                return await interaction.followUp({ embeds: [embed] });
            }

            if (page === 3) {
                const embed = EmbedUtils.createInfoEmbed(
                    '⚙️ الإعدادات والمزيد',
                    'إعدادات متقدمة وأوامر إضافية'
                );
                
                embed.addFields(
                    {
                        name: '🎛️ إعدادات الحساب',
                        value: '• `/settings` - إعداداتك\n• `/my_dashboard` - لوحة التحكم\n• `/privacy` - الخصوصية\n• `/export_data` - تصدير البيانات',
                        inline: false
                    },
                    {
                        name: '📊 إحصائيات',
                        value: '• `/user_stats` - إحصائياتك\n• `/league_standings` - ترتيب الدوري\n• `/predict_match` - توقع مباراة',
                        inline: false
                    },
                    {
                        name: '🆘 المساعدة',
                        value: '• `/quick_start` - البداية السريعة\n• `/about` - معلومات البوت\n• `/support` - الدعم الفني',
                        inline: false
                    }
                );
                
                embed.setFooter({ text: 'الصفحة 3/3 • البوت الرياضي الاحترافي' });
                return await interaction.followUp({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in help command:', error);
            const embed = EmbedUtils.createErrorEmbed('حدث خطأ. جرب /help بدون رقم صفحة.');
            await interaction.followUp({ embeds: [embed] });
        }
    }
};

module.exports = {
    help: helpCommand
};
