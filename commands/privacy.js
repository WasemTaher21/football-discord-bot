const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

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

module.exports = privacyCommand;
