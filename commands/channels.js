const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const HelperUtils = require('../utils/helpers');
const { database } = require('../database/database');
const config = require('../config/config');

// أمر عرض القنوات العارضة
const channelsCommand = {
    data: new SlashCommandBuilder()
        .setName('channels')
        .setDescription('عرض القنوات العارضة لبطولة معينة')
        .addStringOption(option =>
            option.setName('competition')
                .setDescription('اسم البطولة')
                .setRequired(true)
                .addChoices(
                    { name: 'الدوري الإنجليزي', value: 'Premier League' },
                    { name: 'الدوري الإسباني', value: 'La Liga' },
                    { name: 'الدوري الإيطالي', value: 'Serie A' },
                    { name: 'الدوري الألماني', value: 'Bundesliga' },
                    { name: 'الدوري الفرنسي', value: 'Ligue 1' },
                    { name: 'دوري أبطال أوروبا', value: 'Champions League' },
                    { name: 'كأس العالم', value: 'World Cup' }
                ))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('اللغة المفضلة')
                .setRequired(false)
                .addChoices(
                    { name: 'العربية', value: 'ar' },
                    { name: 'الإنجليزية', value: 'en' },
                    { name: 'الكل', value: 'both' }
                )),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const competition = interaction.options.getString('competition');
            const language = interaction.options.getString('language') || 'both';

            // البحث عن القنوات
            let channels = [];

            if (language === 'ar') {
                channels = await database.all(`
                    SELECT channel_name, channel_type, is_free, quality, region
                    FROM broadcast_channels 
                    WHERE (competition = ? OR competition LIKE ?) AND language = 'ar'
                    ORDER BY is_free DESC, quality DESC
                `, [competition, `%${competition}%`]);
            } else if (language === 'en') {
                channels = await database.all(`
                    SELECT channel_name, channel_type, is_free, quality, region
                    FROM broadcast_channels 
                    WHERE (competition = ? OR competition LIKE ?) AND language = 'en'
                    ORDER BY is_free DESC, quality DESC
                `, [competition, `%${competition}%`]);
            } else {
                channels = await database.all(`
                    SELECT channel_name, channel_type, is_free, quality, region, language
                    FROM broadcast_channels 
                    WHERE competition = ? OR competition LIKE ?
                    ORDER BY language, is_free DESC, quality DESC
                `, [competition, `%${competition}%`]);
            }

            if (channels.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    `📺 القنوات العارضة - ${competition}`,
                    'لم يتم العثور على قنوات لهذه البطولة',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `📺 القنوات العارضة - ${competition}`,
                '',
                config.colors.primary
            );

            // تجميع القنوات حسب اللغة
            const arabicChannels = [];
            const englishChannels = [];

            for (const channel of channels) {
                if (language === "both" && channel.language) {
                    if (channel.language === 'ar') {
                        arabicChannels.push(channel);
                    } else {
                        englishChannels.push(channel);
                    }
                } else if (language === "ar" || !channel.language) {
                    arabicChannels.push(channel);
                } else if (language === "en") {
                    englishChannels.push(channel);
                }
            }

            // عرض القنوات العربية
            if (arabicChannels.length > 0) {
                let channelsText = '';
                for (const channel of arabicChannels.slice(0, 8)) {
                    const freeIcon = HelperUtils.getChannelTypeIcon(channel.channel_type, channel.is_free);
                    const qualityIcon = HelperUtils.getQualityIcon(channel.quality);
                    const regionFlag = channel.region === "Arab" ? "🇸🇦" : "🌍";

                    channelsText += `${freeIcon} **${channel.channel_name}** ${qualityIcon} ${regionFlag}\n`;
                    channelsText += `   ┗ ${channel.channel_type} • ${channel.quality}\n\n`;
                }

                embed.addFields({
                    name: '🔥 القنوات العربية',
                    value: channelsText,
                    inline: true
                });
            }

            // عرض القنوات الإنجليزية
            if (englishChannels.length > 0) {
                let channelsText = '';
                for (const channel of englishChannels.slice(0, 8)) {
                    const freeIcon = HelperUtils.getChannelTypeIcon(channel.channel_type, channel.is_free);
                    const qualityIcon = HelperUtils.getQualityIcon(channel.quality);
                    const regionFlag = channel.region === "UK" ? "🇬🇧" : channel.region === "US" ? "🇺🇸" : "🌍";

                    channelsText += `${freeIcon} **${channel.channel_name}** ${qualityIcon} ${regionFlag}\n`;
                    channelsText += `   ┗ ${channel.channel_type} • ${channel.quality}\n\n`;
                }

                embed.addFields({
                    name: '🎬 القنوات الإنجليزية',
                    value: channelsText,
                    inline: true
                });
            }

            // إضافة معلومات إحصائية
            const freeCount = channels.filter(ch => ch.is_free).length;
            const paidCount = channels.length - freeCount;

            embed.addFields({
                name: '📊 إحصائيات',
                value: `🆓 مجانية: ${freeCount}\n💰 مدفوعة: ${paidCount}\n📺 المجموع: ${channels.length}`,
                inline: false
            });

            embed.setFooter({ text: '💡 استخدم /commentators لمعرفة المعلقين' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in channels command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب القنوات. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر عرض المعلقين
const commentatorsCommand = {
    data: new SlashCommandBuilder()
        .setName('commentators')
        .setDescription('عرض المعلقين لبطولة معينة')
        .addStringOption(option =>
            option.setName('competition')
                .setDescription('اسم البطولة')
                .setRequired(false)
                .addChoices(
                    { name: 'الدوري الإنجليزي', value: 'Premier League' },
                    { name: 'الدوري الإسباني', value: 'La Liga' },
                    { name: 'الدوري الإيطالي', value: 'Serie A' },
                    { name: 'الدوري الألماني', value: 'Bundesliga' },
                    { name: 'الدوري الفرنسي', value: 'Ligue 1' },
                    { name: 'دوري أبطال أوروبا', value: 'Champions League' }
                ))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('اللغة المفضلة')
                .setRequired(false)
                .addChoices(
                    { name: 'العربية', value: 'ar' },
                    { name: 'الإنجليزية', value: 'en' },
                    { name: 'الكل', value: 'both' }
                )),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const competition = interaction.options.getString('competition') || 'Premier League';
            const language = interaction.options.getString('language') || 'both';

            // البحث عن المعلقين
            let commentators = [];

            if (language === 'ar') {
                commentators = await database.all(`
                    SELECT name, channel, speciality, rating
                    FROM commentators 
                    WHERE (speciality LIKE ? OR speciality LIKE ?) AND language = 'ar'
                    ORDER BY rating DESC
                `, [`%${competition}%`, '%كرة القدم%']);
            } else if (language === 'en') {
                commentators = await database.all(`
                    SELECT name, channel, speciality, rating
                    FROM commentators 
                    WHERE (speciality LIKE ? OR speciality LIKE ?) AND language = 'en'
                    ORDER BY rating DESC
                `, [`%${competition}%`, '%Football%']);
            } else {
                commentators = await database.all(`
                    SELECT name, channel, speciality, rating, language
                    FROM commentators 
                    WHERE speciality LIKE ? OR speciality LIKE ? OR speciality LIKE ?
                    ORDER BY language, rating DESC
                `, [`%${competition}%`, '%كرة القدم%', '%Football%']);
            }

            if (commentators.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    `🎙️ المعلقين - ${competition}`,
                    'لم يتم العثور على معلقين لهذه البطولة',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createInfoEmbed(
                `🎙️ أفضل المعلقين - ${competition}`,
                '',
                config.colors.warning
            );

            // تجميع المعلقين حسب اللغة
            const arabicCommentators = [];
            const englishCommentators = [];

            for (const commentator of commentators) {
                if (language === "both" && commentator.language) {
                    if (commentator.language === 'ar') {
                        arabicCommentators.push(commentator);
                    } else {
                        englishCommentators.push(commentator);
                    }
                } else if (language === "ar") {
                    arabicCommentators.push(commentator);
                } else if (language === "en") {
                    englishCommentators.push(commentator);
                }
            }

            // عرض المعلقين العرب
            if (arabicCommentators.length > 0) {
                let commentatorsText = '';
                for (let i = 0; i < Math.min(arabicCommentators.length, 6); i++) {
                    const commentator = arabicCommentators[i];
                    const starRating = '⭐'.repeat(Math.floor(commentator.rating / 2));
                    const rankEmoji = i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}️⃣`;

                    commentatorsText += `${rankEmoji} **${commentator.name}** ${starRating}\n`;
                    commentatorsText += `   ┗ ${commentator.channel} • ${commentator.speciality}\n`;
                    commentatorsText += `   ┗ تقييم: ${commentator.rating}/10\n\n`;
                }

                embed.addFields({
                    name: '🔥 المعلقين العرب',
                    value: commentatorsText,
                    inline: true
                });
            }

            // عرض المعلقين الإنجليز
            if (englishCommentators.length > 0) {
                let commentatorsText = '';
                for (let i = 0; i < Math.min(englishCommentators.length, 6); i++) {
                    const commentator = englishCommentators[i];
                    const starRating = '⭐'.repeat(Math.floor(commentator.rating / 2));
                    const rankEmoji = i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}️⃣`;

                    commentatorsText += `${rankEmoji} **${commentator.name}** ${starRating}\n`;
                    commentatorsText += `   ┗ ${commentator.channel} • ${commentator.speciality}\n`;
                    commentatorsText += `   ┗ Rating: ${commentator.rating}/10\n\n`;
                }

                embed.addFields({
                    name: '🎬 المعلقين الإنجليز',
                    value: commentatorsText,
                    inline: true
                });
            }

            embed.setFooter({ text: '⭐ التقييم مبني على تقييمات المشاهدين' });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in commentators command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب المعلقين. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر المباريات المجانية
const freeMatchesCommand = {
    data: new SlashCommandBuilder()
        .setName('free_matches')
        .setDescription('المباريات المجانية اليوم'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // جلب مباريات اليوم
            const today = HelperUtils.getTodayDate();
            const data = await HelperUtils.makeAPIRequest(`/matches?dateFrom=${today}&dateTo=${today}`);

            if (data.error) {
                const errorEmbed = EmbedUtils.createErrorEmbed(`خطأ في جلب البيانات: ${data.error}`);
                return await interaction.followUp({ embeds: [errorEmbed] });
            }

            const matches = data.matches || [];

            if (matches.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '🆓 المباريات المجانية اليوم',
                    'لا توجد مباريات مجدولة اليوم',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // فلترة المباريات التي لها قنوات مجانية
            const freeMatches = [];

            for (const match of matches) {
                const competition = match.competition.name;
                const freeChannels = await database.all(`
                    SELECT channel_name, language, quality
                    FROM broadcast_channels 
                    WHERE (competition = ? OR competition LIKE ?) AND is_free = 1
                `, [competition, `%${competition}%`]);

                if (freeChannels.length > 0) {
                    freeMatches.push({ match, freeChannels });
                }
            }

            if (freeMatches.length === 0) {
                const embed = EmbedUtils.createInfoEmbed(
                    '🆓 المباريات المجانية اليوم',
                    '🔒 للأسف، لا توجد مباريات مجانية اليوم\n💡 جميع المباريات على قنوات مدفوعة',
                    config.colors.warning
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            const embed = EmbedUtils.createSuccessEmbed(
                '🎉 مباريات يمكنك مشاهدتها مجاناً!',
                '🆓 المباريات المجانية اليوم'
            );

            const limitedMatches = freeMatches.slice(0, 5); // أقصى 5 مباريات

            for (const { match, freeChannels } of limitedMatches) {
                const homeTeam = match.homeTeam.name;
                const awayTeam = match.awayTeam.name;
                const matchTime = new Date(match.utcDate);
                const timestamp = Math.floor(matchTime.getTime() / 1000);

                let channelsText = '';
                const arabicChannels = freeChannels.filter(ch => ch.language === 'ar');
                const englishChannels = freeChannels.filter(ch => ch.language === 'en');

                if (arabicChannels.length > 0) {
                    channelsText += "🇸🇦 " + arabicChannels.slice(0, 2).map(ch => ch.channel_name).join(", ") + "\n";
                }
                if (englishChannels.length > 0) {
                    channelsText += "🇬🇧 " + englishChannels.slice(0, 2).map(ch => ch.channel_name).join(", ") + "\n";
                }

                embed.addFields({
                    name: `⚽ ${homeTeam} 🆚 ${awayTeam}`,
                    value: `🕐 <t:${timestamp}:t>\n🏆 ${match.competition.name}\n📺 ${channelsText}`,
                    inline: false
                });
            }

            embed.addFields({
                name: '💡 نصيحة',
                value: 'استخدم `/channels [البطولة]` لمعرفة جميع القنوات العارضة',
                inline: false
            });

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in free_matches command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب المباريات المجانية. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر إضافة قناة جديدة (للمدراء)
const addChannelCommand = {
    data: new SlashCommandBuilder()
        .setName('add_channel')
        .setDescription('إضافة قناة جديدة (للمدراء فقط)')
        .addStringOption(option =>
            option.setName('competition')
                .setDescription('اسم البطولة')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('channel_name')
                .setDescription('اسم القناة')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('لغة القناة')
                .setRequired(true)
                .addChoices(
                    { name: 'العربية', value: 'ar' },
                    { name: 'الإنجليزية', value: 'en' }
                ))
        .addBooleanOption(option =>
            option.setName('is_free')
                .setDescription('هل القناة مجانية؟')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('quality')
                .setDescription('جودة البث')
                .setRequired(false)
                .addChoices(
                    { name: 'HD', value: 'HD' },
                    { name: '4K/HD', value: '4K/HD' },
                    { name: 'SD', value: 'SD' }
                )),

    async execute(interaction, client) {
        // التحقق من الصلاحيات
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            const embed = EmbedUtils.createErrorEmbed(
                'هذا الأمر مخصص للمدراء فقط!',
                '❌ ليس لديك صلاحية'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const competition = interaction.options.getString('competition');
            const channelName = interaction.options.getString('channel_name');
            const language = interaction.options.getString('language');
            const isFree = interaction.options.getBoolean('is_free') || false;
            const quality = interaction.options.getString('quality') || 'HD';

            // إضافة القناة
            await database.run(`
                INSERT INTO broadcast_channels 
                (competition, region, channel_name, channel_type, is_free, quality, language)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [competition, "Custom", channelName, "Custom", isFree, quality, language]);

            const embed = EmbedUtils.createSuccessEmbed('', '✅ تم إضافة القناة بنجاح')
                .addFields(
                    { name: 'القناة', value: channelName, inline: true },
                    { name: 'البطولة', value: competition, inline: true },
                    { name: 'اللغة', value: language === 'ar' ? 'عربي' : 'إنجليزي', inline: true },
                    { name: 'مجانية؟', value: isFree ? 'نعم 🆓' : 'لا 💰', inline: true },
                    { name: 'الجودة', value: quality, inline: true }
                );

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in add_channel command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ في إضافة القناة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// أمر تفاصيل مباراة معينة
const matchDetailsCommand = {
    data: new SlashCommandBuilder()
        .setName('match_details')
        .setDescription('تفاصيل مباراة معينة')
        .addStringOption(option =>
            option.setName('team1')
                .setDescription('الفريق الأول')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('team2')
                .setDescription('الفريق الثاني')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('التاريخ (YYYY-MM-DD) - اختياري')
                .setRequired(false)),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const team1 = interaction.options.getString('team1');
            const team2 = interaction.options.getString('team2');
            const date = interaction.options.getString('date') || HelperUtils.getTodayDate();

            // البحث عن المباراة
            const data = await HelperUtils.makeAPIRequest(`/matches?dateFrom=${date}&dateTo=${date}`);

            if (data.error) {
                const errorEmbed = EmbedUtils.createErrorEmbed(`خطأ في البحث: ${data.error}`);
                return await interaction.followUp({ embeds: [errorEmbed] });
            }

            // البحث عن المباراة المطلوبة
            let targetMatch = null;
            for (const match of data.matches || []) {
                const homeName = match.homeTeam.name.toLowerCase();
                const awayName = match.awayTeam.name.toLowerCase();

                if ((team1.toLowerCase().includes(homeName) || homeName.includes(team1.toLowerCase())) &&
                    (team2.toLowerCase().includes(awayName) || awayName.includes(team2.toLowerCase()))) {
                    targetMatch = match;
                    break;
                } else if ((team2.toLowerCase().includes(homeName) || homeName.includes(team2.toLowerCase())) &&
                           (team1.toLowerCase().includes(awayName) || awayName.includes(team1.toLowerCase()))) {
                    targetMatch = match;
                    break;
                }
            }

            if (!targetMatch) {
                const embed = EmbedUtils.createErrorEmbed(
                    `لم يتم العثور على مباراة بين ${team1} و ${team2} في تاريخ ${date}`,
                    '❌ لم يتم العثور على المباراة'
                );
                return await interaction.followUp({ embeds: [embed] });
            }

            // الحصول على معلومات البث
            const broadcastInfo = await HelperUtils.getBroadcastInfo(targetMatch.competition.name);

            // إنشاء الـ embed
            const embed = EmbedUtils.createMatchEmbed(
                targetMatch, 
                '🔍 تفاصيل المباراة الكاملة', 
                broadcastInfo
            );

            // إضافة معلومات إضافية
            if (targetMatch.venue) {
                embed.addFields({
                    name: '🏟️ الملعب',
                    value: targetMatch.venue,
                    inline: true
                });
            }

            if (targetMatch.referees && targetMatch.referees.length > 0) {
                const referees = targetMatch.referees.map(ref => ref.name).join(", ");
                embed.addFields({
                    name: '👨‍⚖️ الحكام',
                    value: referees,
                    inline: true
                });
            }

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error in match_details command:', error);
            const errorEmbed = EmbedUtils.createErrorEmbed('حدث خطأ أثناء جلب تفاصيل المباراة. يرجى المحاولة مرة أخرى.');
            await interaction.followUp({ embeds: [errorEmbed] });
        }
    }
};

// تصدير جميع الأوامر
module.exports = {
    channels: channelsCommand,
    commentators: commentatorsCommand,
    freeMatches: freeMatchesCommand,
    addChannel: addChannelCommand,
    matchDetails: matchDetailsCommand
};