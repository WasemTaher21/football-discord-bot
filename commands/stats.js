const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const leagueStandingsCommand = {
    data: new SlashCommandBuilder()
        .setName('league_standings')
        .setDescription('ترتيب الدوري')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('اختر الدوري')
                .setRequired(false)
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
            const league = interaction.options.getString('league') || 'PL';
            
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

            // ترتيبات مؤقتة
            const standings = {
                'PL': '1. Manchester City ⭐\n2. Arsenal\n3. Liverpool ⭐\n4. Aston Villa\n5. Tottenham',
                'PD': '1. Real Madrid ⭐\n2. Barcelona ⭐\n3. Girona\n4. Atletico Madrid ⭐\n5. Athletic Bilbao',
                'SA': '1. Inter Milan ⭐\n2. AC Milan ⭐\n3. Juventus ⭐\n4. Atalanta\n5. Roma',
                'BL1': '1. Bayern Munich ⭐\n2. Borussia Dortmund ⭐\n3. RB Leipzig\n4. Union Berlin\n5. SC Freiburg',
                'FL1': '1. Paris Saint-Germain ⭐\n2. Monaco\n3. Brest\n4. Lille ⭐\n5. Nice',
                'DED': '1. PSV Eindhoven\n2. Feyenoord\n3. Ajax ⭐\n4. AZ Alkmaar\n5. FC Twente',
                'PPL': '1. Sporting CP ⭐\n2. Porto ⭐\n3. Benfica ⭐\n4. Braga\n5. Vitoria Guimaraes',
                'SPL': '1. الهلال ⭐\n2. النصر ⭐\n3. الأهلي ⭐\n4. الاتحاد ⭐\n5. الشباب',
                'EGY': '1. الأهلي ⭐\n2. الزمالك ⭐\n3. بيراميدز\n4. المصري\n5. سموحة',
                'UAE': '1. الأهلي دبي\n2. شباب الأهلي ⭐\n3. الوصل\n4. النصر\n5. العين',
                'LBY': '1. الأهلي طرابلس ⭐\n2. الاتحاد طرابلس ⭐\n3. الهلال بنغازي\n4. الأولمبي الزاوية\n5. النصر بنغازي \n6. الاهلي بنغازي'
            };
            
            const embed = new EmbedBuilder()
                .setTitle('📊 ترتيب الدوري')
                .setDescription(`**${leagueNames[league]}**\n\nالترتيب الحالي:`)
                .setColor(0x0099ff)
                .addFields({
                    name: 'المراكز الخمسة الأولى',
                    value: standings[league] || 'ترتيب غير متوفر حالياً',
                    inline: false
                })
                .addFields({
                    name: '💡 ملاحظة',
                    value: '⭐ = فرق مفضلة\n🏆 = مؤهل للمسابقات القارية\n📈 = ترتيب محدث',
                    inline: false
                })
                .setFooter({ text: 'ترتيب محدث • استخدم /matches لمباريات اليوم' });

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
