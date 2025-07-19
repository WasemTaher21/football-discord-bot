const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quick_start')
        .setDescription('البداية السريعة للمستخدمين الجدد'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🚀 البداية السريعة')
                .setDescription('مرحباً! إليك أهم الأوامر للبدء:')
                .setColor(0x00ff00)
                .addFields(
                    {
                        name: '1️⃣ أضف فريقك المفضل',
                        value: '`/add_team Real Madrid`\n*سيعرض البوت مباريات فريقك تلقائياً*',
                        inline: false
                    },
                    {
                        name: '2️⃣ شاهد مباريات اليوم',
                        value: '`/matches`\n*مباريات فرقك المفضلة اليوم*',
                        inline: false
                    },
                    {
                        name: '3️⃣ المباريات المباشرة',
                        value: '`/live`\n*المباريات الجارية الآن*',
                        inline: false
                    },
                    {
                        name: '4️⃣ إعداداتك',
                        value: '`/settings`\n*تخصيص تجربتك*',
                        inline: false
                    }
                )
                .addFields({
                    name: '💡 نصائح',
                    value: '• استخدم `/help` للدليل الكامل\n• استخدم `/my_dashboard` للنظرة الشاملة\n• أضف عدة فرق لتغطية أفضل',
                    inline: false
                })
                .setFooter({ text: 'مرحباً بك في البوت الرياضي!' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Quick start error:', error);
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    }
};
