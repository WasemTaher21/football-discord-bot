const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league_standings')
        .setDescription('ترتيب الدوري')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('اختر الدوري')
                .setRequired(true)
                .addChoices(
                    { name: '🇬🇧 الدوري الإنجليزي', value: 'english' },
                    { name: '🇪🇸 الدوري الإسباني', value: 'spanish' },
                    { name: '🇮🇹 الدوري الإيطالي', value: 'italian' },
                    { name: '🇩🇪 الدوري الألماني', value: 'german' },
                    { name: '🇫🇷 الدوري الفرنسي', value: 'french' },
                    { name: '🇸🇦 الدوري السعودي', value: 'saudi' },
                    { name: '🇪🇬 الدوري المصري', value: 'egyptian' },
                    { name: '🇱🇾 الدوري الليبي', value: 'libyan' }
                )),

    async execute(interaction) {
        try {
            const league = interaction.options.getString('league');
            
            console.log(`تم اختيار: ${league}`);

            const leagues = {
                english: {
                    name: '🇬🇧 الدوري الإنجليزي الممتاز',
                    standings: '1. Manchester City 🏆\n2. Arsenal\n3. Liverpool\n4. Aston Villa\n5. Tottenham\n6. Brighton\n7. Newcastle\n8. Manchester United',
                    color: 0x3498db
                },
                spanish: {
                    name: '🇪🇸 الدوري الإسباني - لا ليغا',
                    standings: '1. Real Madrid 🏆\n2. Barcelona\n3. Girona\n4. Atletico Madrid\n5. Athletic Bilbao\n6. Real Sociedad\n7. Real Betis\n8. Valencia',
                    color: 0xe74c3c
                },
                italian: {
                    name: '🇮🇹 الدوري الإيطالي - سيريا أ',
                    standings: '1. Inter Milan 🏆\n2. AC Milan\n3. Juventus\n4. Atalanta\n5. Roma\n6. Lazio\n7. Napoli\n8. Fiorentina',
                    color: 0x27ae60
                },
                german: {
                    name: '🇩🇪 الدوري الألماني - البوندسليغا',
                    standings: '1. Bayern Munich 🏆\n2. Borussia Dortmund\n3. RB Leipzig\n4. Union Berlin\n5. SC Freiburg\n6. Bayer Leverkusen\n7. Eintracht Frankfurt\n8. Wolfsburg',
                    color: 0xf39c12
                },
                french: {
                    name: '🇫🇷 الدوري الفرنسي - ليغ 1',
                    standings: '1. Paris Saint-Germain 🏆\n2. Monaco\n3. Brest\n4. Lille\n5. Nice\n6. Lens\n7. Marseille\n8. Rennes',
                    color: 0x9b59b6
                },
                saudi: {
                    name: '🇸🇦 الدوري السعودي للمحترفين',
                    standings: '1. الهلال 👑\n2. النصر ⭐\n3. الأهلي\n4. الاتحاد\n5. الشباب\n6. الفيصلي\n7. الرائد\n8. ضمك',
                    color: 0x00ff00
                },
                egyptian: {
                    name: '🇪🇬 الدوري المصري الممتاز',
                    standings: '1. الأهلي 👑\n2. الزمالك ⭐\n3. بيراميدز\n4. المصري\n5. سموحة\n6. البنك الأهلي\n7. إنبي\n8. فيوتشر',
                    color: 0xff0000
                },
                libyan: {
                    name: '🇱🇾 الدوري الليبي الممتاز',
                    standings: '1. الأهلي طرابلس 👑\n2. الاتحاد طرابلس ⭐\n3. الأهلي بنغازي 🔥\n4. الهلال بنغازي\n5. الأولمبي الزاوية\n6. النصر بنغازي\n7. المحلة\n8. أسود الجبل',
                    color: 0xff4444
                }
            };

            const selectedLeague = leagues[league];
            
            if (!selectedLeague) {
                return await interaction.reply({
                    content: '❌ دوري غير معروف!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 ترتيب الدوري')
                .setDescription(`**${selectedLeague.name}**\n\n${selectedLeague.standings}`)
                .setColor(selectedLeague.color)
                .addFields({
                    name: '📈 الرموز',
                    value: '👑 = بطل الدوري\n⭐ = فريق مميز\n🏆 = مؤهل لدوري الأبطال\n🔥 = فريق صاعد',
                    inline: false
                })
                .setFooter({ text: `${selectedLeague.name} • ترتيب محدث` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('League standings error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في عرض ترتيب الدوري.',
                ephemeral: true
            });
        }
    }
};
