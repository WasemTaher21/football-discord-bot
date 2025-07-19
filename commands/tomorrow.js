const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tomorrow')
        .setDescription('مباريات الغد'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('📅 مباريات الغد')
                .setDescription('المباريات المقررة غداً:')
                .setColor(0x0099ff)
                .addFields(
                    {
                        name: '🇸🇦 الدوري السعودي',
                        value: '• **الهلال 🆚 الأهلي** - 8:00 م\n📺 **SSC 1**',
                        inline: false
                    },
                    {
                        name: '🇪🇬 الدوري المصري',
                        value: '• **الأهلي 🆚 الزمالك** - 9:30 م\n📺 **ON Sport**',
                        inline: false
                    },
                    {
                        name: '🇬🇧 الدوري الإنجليزي',
                        value: '• **آرسنال 🆚 تشيلسي** - 11:00 م\n📺 **bein Sports 1**',
                        inline: false
                    }
                )
                .setFooter({ text: 'مباريات الغد' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Tomorrow error:', error);
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    }
};
