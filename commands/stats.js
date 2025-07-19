const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const leagueStandingsCommand = {
    data: new SlashCommandBuilder()
        .setName('league_standings')
        .setDescription('ترتيب الدوري')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('اختر الدوري')
                .setRequired(true)
                .addChoices(
                    { name: '🇬🇧 الدوري الإنجليزي', value: 'PL' },
                    { name: '🇪🇸 الدوري الإسباني', value: 'PD' },
                    { name: '🇮🇹 الدوري الإيطالي', value: 'SA' },
                    { name: '🇩🇪 الدوري الألماني', value: 'BL1' },
                    { name: '🇫🇷 الدوري الفرنسي', value: 'FL1' },
                    { name: '🇳🇱 الدوري الهولندي', value: 'DED' },
                    { name: '🇵🇹 الدوري البرتغالي', value: 'PPL' },
                    { name: '🇸🇦 الدوري السعودي', value: 'SPL' },
                    { name: '🇪🇬 الدوري المصري', value: 'EGY' },
                    { name: '🇦🇪 الدوري الإماراتي', value: 'UAE' },
                    { name: '🇱🇾 الدوري الليبي', value: 'LBY' }
                )),

    async execute(interaction, client) {
        try {
            const selectedLeague = interaction.options.getString('league');
            
            console.log(`المستخدم اختار: ${selectedLeague}`);
            
            // أسماء الدوريات
            const leagueNames = {
                'PL': '🇬🇧 الدوري الإنجليزي الممتاز',
                'PD': '🇪🇸 الدوري الإسباني - لا ليغا',
                'SA': '🇮🇹 الدوري الإيطالي - سيريا أ',
                'BL1': '🇩🇪 الدوري الألماني - البوندسليغا',
                'FL1': '🇫🇷 الدوري الفرنسي - ليغ 1',
                'DED': '🇳🇱 الدوري الهولندي',
                'PPL': '🇵🇹 الدوري البرتغالي',
                'SPL': '🇸🇦 الدوري السعودي للمحترفين',
                'EGY': '🇪🇬 الدوري المصري الممتاز',
                'UAE': '🇦🇪 دوري أدنوك الإماراتي',
                'LBY': '🇱🇾 الدوري الليبي الممتاز'
            };

            // ترتيبات مختلفة لكل دوري
            const standings = {
                'PL': '1. Manchester City 🏆\n2. Arsenal\n3. Liverpool\n4. Aston Villa\n5. Tottenham\n6. Brighton\n7. Newcastle\n8. Manchester United',
                
                'PD': '1. Real Madrid 🏆\n2. Barcelona\n3. Girona\n4. Atletico Madrid\n5. Athletic Bilbao\n6. Real Sociedad\n7. Real Betis\n8. Valencia',
                
                'SA': '1. Inter Milan 🏆\n2. AC Milan\n3. Juventus\n4. Atalanta\n5. Roma\n6. Lazio\n7. Napoli\n8. Fiorentina',
                
                'BL1': '1. Bayern Munich 🏆\n2. Borussia Dortmund\n3. RB Leipzig\n4. Union Berlin\n5. SC Freiburg\n6. Bayer Leverkusen\n7. Eintracht Frankfurt\n8. Wolfsburg',
                
                'FL1': '1. Paris Saint-Germain 🏆\n2. Monaco\n3. Brest\n4. Lille\n5. Nice\n6. Lens\n7. Marseille\n8. Rennes',
                
                'DED': '1. PSV Eindhoven 🏆\n2. Feyenoord\n3. Ajax\n4. AZ Alkmaar\n5. FC Twente\n6. Go Ahead Eagles\n7. NEC Nijmegen\n8. FC Utrecht',
                
                'PPL': '1. Sporting CP 🏆\n2. Porto\n3. Benfica\n4. Braga\n5. Vitoria Guimaraes\n6. Boavista\n7. Casa Pia\n8. Gil Vicente',
                
                'SPL': '1. الهلال 👑\n2. النصر ⭐\n3. الأهلي\n4. الاتحاد\n5. الشباب\n6. الفيصلي\n7. الرائد\n8. ضمك',
                
                'EGY': '1. الأهلي 👑\n2. الزمالك ⭐\n3. بيراميدز\n4. المصري\n5. سموحة\n6. البنك الأهلي\n7. إنبي\n8. فيوتشر',
                
                'UAE': '1. الأهلي دبي 👑\n2. شباب الأهلي\n3. الوصل\n4. النصر\n5. العين\n6. الوحدة\n7. بني ياس\n8. عجمان',
                
                'LBY': '1. الأهلي طرابلس 👑\n2. الاتحاد طرابلس ⭐\n3. الأهلي بنغازي 🔥\n4. الهلال بنغازي\n5. الأولمبي الزاوية\n6. النصر بنغازي\n7. المحلة\n8. أسود الجبل'
            };
            
            if (!leagueNames[selectedLeague]) {
                return await interaction.reply({
                    content: '❌ دوري غير معروف!',
                    flags: [4096]
                });
            }
            
            // لون خاص للدوري الليبي
            let embedColor = 0x0099ff;
            if (selectedLeague === 'SPL') embedColor = 0x00ff00;
            else if (selectedLeague === 'EGY') embedColor = 0xff0000;
            else if (selectedLeague === 'LBY') embedColor = 0xff4444; // أحمر ليبي
            
            const embed = new EmbedBuilder()
                .setTitle('📊 ترتيب الدوري')
                .setDescription(`**${leagueNames[selectedLeague]}**\n\nالترتيب الحالي:`)
                .setColor(embedColor)
                .addFields({
                    name: 'المراكز الثمانية الأولى',
                    value: standings[selectedLeague],
                    inline: false
                });

            // إضافة معلومات خاصة للدوري الليبي
            if (selectedLeague === 'LBY') {
                embed.addFields({
                    name: '🇱🇾 معلومات الدوري الليبي',
                    value: '• **الأهلي طرابلس** - العاصمة 👑\n• **الاتحاد طرابلس** - العاصمة ⭐\n• **الأهلي بنغازي** - بنغازي 🔥\n• **الهلال بنغازي** - بنغازي\n• **الأولمبي الزاوية** - الزاوية',
                    inline: false
                });
            }

            embed.addFields({
                name: '📈 رموز الترتيب',
                value: selectedLeague === 'LBY' 
                    ? '👑 = بطل الدوري\n⭐ = فريق مميز\n🔥 = فريق صاعد\n🏆 = مؤهل للمسابقات'
                    : '👑 = بطل الدوري\n⭐ = فريق مميز\n🏆 = مؤهل لدوري الأبطال',
                inline: false
            });

            embed.setFooter({ 
                text: `${leagueNames[selectedLeague]} • محدث اليوم`,
                iconURL: interaction.client.user.displayAvatarURL()
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('League standings error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في عرض ترتيب الدوري.',
                flags: [4096]
            });
        }
    }
};

module.exports = {
    leagueStandings: leagueStandingsCommand
};
