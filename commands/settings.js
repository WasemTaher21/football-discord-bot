const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

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

module.exports = settingsCommand;
