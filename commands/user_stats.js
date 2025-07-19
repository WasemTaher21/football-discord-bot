const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user_stats')
        .setDescription('إحصائياتك الشخصية'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('📊 إحصائياتك الشخصية')
                .setDescription(`إحصائيات ${interaction.user.username}:`)
                .setColor(0x9966ff)
                .addFields(
                    {
                        name: '⭐ فرقك المفضلة',
                        value: '**العدد:** 0 فريق\n**آخر إضافة:** -',
                        inline: true
                    },
                    {
                        name: '🏃‍♂️ لاعبوك المفضلون',
                        value: '**العدد:** 0 لاعب\n**آخر إضافة:** -',
                        inline: true
                    },
                    {
                        name: '📅 الاستخدام',
                        value: '**أول استخدام:** اليوم\n**آخر نشاط:** الآن',
                        inline: true
                    }
                )
                .addFields(
                    {
                        name: '🎯 الأوامر المستخدمة',
                        value: '• `/help` - مرة واحدة\n• `/user_stats` - مرة واحدة\n**المجموع:** 2 أوامر',
                        inline: false
                    }
                )
                .addFields({
                    name: '💡 نصيحة',
                    value: 'أضف فرقك المفضلة بـ `/add_team` لتحسين إحصائياتك!',
                    inline: false
                })
                .setFooter({ text: 'إحصائيات شخصية' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('User stats error:', error);
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    }
};
