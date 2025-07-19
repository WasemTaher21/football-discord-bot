const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('live')
        .setDescription('المباريات المباشرة'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🔴 المباريات المباشرة')
                .setDescription('المباريات الجارية الآن:')
                .setColor(0xff0000)
                .addFields(
                    {
                        name: '⚽ الدوري الإسباني',
                        value: '**ريال مدريد 2-1 برشلونة** (75\')\n📺 **bein Sports 1**',
                        inline: false
                    },
                    {
                        name: '⚽ الدوري الإنجليزي',
                        value: '**ليفربول 0-0 مانشستر سيتي** (35\')\n📺 **bein Sports 2**',
                        inline: false
                    }
                )
                .setFooter({ text: '🔴 مباشر الآن' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Live error:', error);
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    }
};
