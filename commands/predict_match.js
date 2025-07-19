const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('predict_match')
        .setDescription('توقع نتيجة مباراة (للمتعة)')
        .addStringOption(option =>
            option.setName('team1')
                .setDescription('الفريق الأول')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('team2')
                .setDescription('الفريق الثاني')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const team1 = interaction.options.getString('team1');
            const team2 = interaction.options.getString('team2');
            
            // توقع عشوائي للمتعة
            const results = [
                `${team1} 2-1 ${team2}`,
                `${team1} 1-2 ${team2}`,
                `${team1} 3-0 ${team2}`,
                `${team1} 0-3 ${team2}`,
                `${team1} 1-1 ${team2}`,
                `${team1} 2-2 ${team2}`
            ];
            
            const prediction = results[Math.floor(Math.random() * results.length)];
            const confidence = Math.floor(Math.random() * 40) + 60; // 60-99%
            
            const embed = new EmbedBuilder()
                .setTitle('🔮 توقع المباراة')
                .setDescription('**توقع البوت للمباراة:**')
                .setColor(0xff6b6b)
                .addFields(
                    {
                        name: '⚽ النتيجة المتوقعة',
                        value: `**${prediction}**`,
                        inline: false
                    },
                    {
                        name: '📊 نسبة الثقة',
                        value: `${confidence}%`,
                        inline: true
                    },
                    {
                        name: '🎯 التحليل',
                        value: 'مباراة متقاربة ومثيرة متوقعة!',
                        inline: true
                    }
                )
                .addFields({
                    name: '⚠️ تنبيه',
                    value: 'هذا توقع للترفيه فقط! النتائج الحقيقية قد تختلف.',
                    inline: false
                })
                .setFooter({ text: '🔮 توقع ترفيهي' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Predict match error:', error);
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    }
};
