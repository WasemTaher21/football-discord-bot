const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('معلومات حول البوت الرياضي'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🤖 حول البوت الرياضي')
                .setDescription('البوت الأكثر تطوراً لمتابعة كرة القدم على Discord')
                .setColor(0x0099ff)
                .addFields(
                    {
                        name: '🏆 المميزات الرئيسية',
                        value: '• متابعة مباشرة للمباريات\n• معلومات القنوات والمعلقين\n• نظام مفضلة ذكي\n• إحصائيات متقدمة',
                        inline: false
                    },
                    {
                        name: '🌍 الدوريات المدعومة',
                        value: '• الدوري الإنجليزي\n• الدوري الإسباني\n• الدوري السعودي\n• الدوري المصري\n• والمزيد...',
                        inline: false
                    },
                    {
                        name: '📊 إحصائيات البوت',
                        value: `• **الخوادم:** ${interaction.client.guilds.cache.size}\n• **المستخدمين:** ${interaction.client.users.cache.size}\n• **الأوامر:** ${interaction.client.commands.size}`,
                        inline: false
                    }
                )
                .addFields({
                    name: '🔗 الإصدار',
                    value: '**الإصدار:** v2.0.0\n**التطوير:** مستمر\n**الدعم:** 24/7',
                    inline: false
                })
                .setFooter({ text: 'شكراً لاستخدامك البوت الرياضي!' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('About error:', error);
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    }
};
