const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('معلومات الدعم والمساعدة'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🛟 الدعم والمساعدة')
                .setDescription('نحن هنا لمساعدتك!')
                .setColor(0xff9900)
                .addFields(
                    {
                        name: '📚 موارد المساعدة',
                        value: '• `/help` - دليل البوت الكامل\n• `/quick_start` - البداية السريعة\n• `/about` - معلومات البوت',
                        inline: false
                    },
                    {
                        name: '🔧 مشاكل شائعة',
                        value: '• **البوت لا يرد:** تأكد من الصلاحيات\n• **لا أرى مباريات:** أضف فرقك بـ `/add_team`\n• **خطأ في الأوامر:** جرب `/help`',
                        inline: false
                    },
                    {
                        name: '💬 التواصل',
                        value: '• **الدعم الفني:** متوفر في الخادم\n• **الإبلاغ عن مشاكل:** تواصل مع الإدارة\n• **اقتراحات:** مرحب بها دائماً',
                        inline: false
                    }
                )
                .addFields({
                    name: '🎯 نصائح',
                    value: 'استخدم الأوامر بانتظام للحصول على أفضل تجربة!',
                    inline: false
                })
                .setFooter({ text: 'فريق الدعم جاهز لمساعدتك' });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Support error:', error);
            await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
        }
    }
};
