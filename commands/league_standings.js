const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league_table')
        .setDescription('ترتيب الدوري')
        .addStringOption(option =>
            option.setName('league')
                .setDescription('اختر الدوري')
                .setRequired(true)
                .addChoices(
                    { name: '🇬🇧 إنجليزي', value: 'english' },
                    { name: '🇪🇸 إسباني', value: 'spanish' },
                    { name: '🇮🇹 إيطالي', value: 'italian' },
                    { name: '🇩🇪 ألماني', value: 'german' },
                    { name: '🇫🇷 فرنسي', value: 'french' },
                    { name: '🇸🇦 سعودي', value: 'saudi' },
                    { name: '🇪🇬 مصري', value: 'egyptian' },
                    { name: '🇱🇾 ليبي', value: 'libyan' }
                )),

    async execute(interaction) {
        try {
            const league = interaction.options.getString('league');
            
            // تشخيص واضح
            console.log('=== LEAGUE DEBUG ===');
            console.log('Selected league:', league);
            console.log('Type:', typeof league);
            console.log('===================');

            let title = '';
            let standings = '';
            let color = 0x0099ff;

            // منطق واضح ومفصل
            if (league === 'english') {
                title = '🇬🇧 الدوري الإنجليزي الممتاز';
                standings = '1. Manchester City 🏆\n2. Arsenal\n3. Liverpool\n4. Aston Villa\n5. Tottenham';
                color = 0x3498db;
            } 
            else if (league === 'spanish') {
                title = '🇪🇸 الدوري الإسباني - لا ليغا';
                standings = '1. Real Madrid 🏆\n2. Barcelona\n3. Girona\n4. Atletico Madrid\n5. Athletic Bilbao';
                color = 0xe74c3c;
            }
            else if (league === 'italian') {
                title = '🇮🇹 الدوري الإيطالي - سيريا أ';
                standings = '1. Inter Milan 🏆\n2. AC Milan\n3. Juventus\n4. Atalanta\n5. Roma';
                color = 0x27ae60;
            }
            else if (league === 'german') {
                title = '🇩🇪 الدوري الألماني - البوندسليغا';
                standings = '1. Bayern Munich 🏆\n2. Borussia Dortmund\n3. RB Leipzig\n4. Union Berlin\n5. SC Freiburg';
                color = 0xf39c12;
            }
            else if (league === 'french') {
                title = '🇫🇷 الدوري الفرنسي - ليغ 1';
                standings = '1. Paris Saint-Germain 🏆\n2. Monaco\n3. Brest\n4. Lille\n5. Nice';
                color = 0x9b59b6;
            }
            else if (league === 'saudi') {
                title = '🇸🇦 الدوري السعودي للمحترفين';
                standings = '1. الهلال 👑\n2. النصر ⭐\n3. الأهلي\n4. الاتحاد\n5. الشباب';
                color = 0x00ff00;
            }
            else if (league === 'egyptian') {
                title = '🇪🇬 الدوري المصري الممتاز';
                standings = '1. الأهلي 👑\n2. الزمالك ⭐\n3. بيراميدز\n4. المصري\n5. سموحة';
                color = 0xff0000;
            }
            else if (league === 'libyan') {
                title = '🇱🇾 الدوري الليبي الممتاز';
                standings = '1. الأهلي طرابلس 👑\n2. الاتحاد طرابلس ⭐\n3. الأهلي بنغازي 🔥\n4. الهلال بنغازي\n5. الأولمبي الزاوية \n6. النصر بنغازي';
                color = 0xff4444;
            }
            else {
                return await interaction.reply({
                    content: '❌ دوري غير معروف!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 ترتيب الدوري')
                .setDescription(`**${title}**\n\n${standings}`)
                .setColor(color)
                .setFooter({ text: `اخترت: ${league}` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('League table error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في عرض ترتيب الدوري.',
                ephemeral: true
            });
        }
    }
};
