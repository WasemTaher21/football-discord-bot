const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

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

module.exports = dashboardCommand;
