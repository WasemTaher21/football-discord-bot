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
                    { name: 'الدوري الإنجليزي', value: 'PL' },
                    { name: 'الدوري الإسباني', value: 'PD' },
                    { name: 'الدوري السعودي', value: 'SPL' }
                )),

    async execute(interaction, client) {
        try {
            const league = interaction.options.getString('league') || 'PL';
            
            const embed = new EmbedBuilder()
                .setTitle('📊 ترتيب الدوري')
                .setDescription(`ترتيب ${league === 'PL' ? 'الدوري الإنجليزي' : 'الدوري'}:`)
                .setColor(0x0099ff)
                .addFields({
                    name: 'المراكز الأولى',
                    value: '1. Manchester City\n2. Arsenal\n3. Liverpool\n4. Newcastle\n5. Manchester United',
                    inline: false
                })
                .setFooter({ text: 'ترتيب محدث' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('League standings error:', error);
            await interaction.reply({
                content: '❌ حدث خطأ في عرض ترتيب الدوري.',
                flags: [4096] // MessageFlags.Ephemeral
            });
        }
    }
};

module.exports = {
    leagueStandings: leagueStandingsCommand
};
