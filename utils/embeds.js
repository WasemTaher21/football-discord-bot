const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

class EmbedUtils {
    // إنشاء embed للمباراة
    static createMatchEmbed(match, title = 'معلومات المباراة', broadcastInfo = null) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(match.status === 'FINISHED' ? config.colors.match.finished : 
                     match.status === 'IN_PLAY' || match.status === 'LIVE' ? config.colors.match.live :
                     config.colors.match.scheduled);

        // معلومات الفرق
        const homeTeam = match.homeTeam.name;
        const awayTeam = match.awayTeam.name;

        // النتيجة
        let score = 'لم تبدأ بعد';
        if (match.score.fullTime.home !== null) {
            score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
        }

        embed.addFields(
            { name: '🏟️ المباراة', value: `**${homeTeam}** 🆚 **${awayTeam}**`, inline: false },
            { name: '⚽ النتيجة', value: `**${score}**`, inline: true },
            { name: '🏆 البطولة', value: match.competition.name, inline: true }
        );

        // الوقت
        const matchDate = new Date(match.utcDate);
        const timestamp = Math.floor(matchDate.getTime() / 1000);
        embed.addFields({ name: '🕐 التوقيت', value: `<t:${timestamp}:F>`, inline: true });

        // حالة المباراة
        const statusInfo = config.matchStatus[match.status] || { emoji: '❓', text: match.status };
        embed.addFields({ name: '📊 الحالة', value: `${statusInfo.emoji} ${statusInfo.text}`, inline: true });

        // الشوط الأول إذا انتهت المباراة
        if (match.status === 'FINISHED' && match.score.halfTime.home !== null) {
            embed.addFields({
                name: '⏰ الشوط الأول',
                value: `${match.score.halfTime.home} - ${match.score.halfTime.away}`,
                inline: true
            });
        }

        // معلومات البث إذا كانت متوفرة
        if (broadcastInfo) {
            this.addBroadcastInfo(embed, broadcastInfo);
        }

        embed.setFooter({ text: 'البوت الرياضي الاحترافي • معلومات البث محدثة' });
        
        return embed;
    }

    // إضافة معلومات البث للـ embed
    static addBroadcastInfo(embed, broadcastInfo) {
        // القنوات العربية
        if (broadcastInfo.arabicChannels && broadcastInfo.arabicChannels.length > 0) {
            let channelsText = '';
            for (const channel of broadcastInfo.arabicChannels.slice(0, 3)) {
                const freeIcon = channel.is_free ? '🆓' : '💰';
                const qualityIcon = channel.quality.includes('4K') ? '📺✨' : '📺';
                
                channelsText += `${freeIcon} **${channel.channel_name}** ${qualityIcon}\n`;
                channelsText += `   ┗ ${channel.channel_type} • ${channel.quality}\n`;
            }
            
            embed.addFields({ name: '📺 القنوات العربية', value: channelsText, inline: true });
        }

        // القنوات الإنجليزية
        if (broadcastInfo.englishChannels && broadcastInfo.englishChannels.length > 0) {
            let channelsText = '';
            for (const channel of broadcastInfo.englishChannels.slice(0, 3)) {
                const freeIcon = channel.is_free ? '🆓' : '💰';
                const qualityIcon = channel.quality.includes('4K') ? '📺✨' : '📺';
                
                channelsText += `${freeIcon} **${channel.channel_name}** ${qualityIcon}\n`;
                channelsText += `   ┗ ${channel.channel_type} • ${channel.quality}\n`;
            }
            
            embed.addFields({ name: '📺 القنوات الإنجليزية', value: channelsText, inline: true });
        }

        // المعلقين العرب
        if (broadcastInfo.arabicCommentators && broadcastInfo.arabicCommentators.length > 0) {
            let commentatorsText = '';
            for (const commentator of broadcastInfo.arabicCommentators.slice(0, 2)) {
                const starRating = '⭐'.repeat(Math.floor(commentator.rating / 2));
                
                commentatorsText += `🎙️ **${commentator.name}** ${starRating}\n`;
                commentatorsText += `   ┗ ${commentator.channel} • ${commentator.speciality}\n`;
            }
            
            embed.addFields({ name: '🎙️ التعليق العربي', value: commentatorsText, inline: true });
        }

        // المعلقين الإنجليز
        if (broadcastInfo.englishCommentators && broadcastInfo.englishCommentators.length > 0) {
            let commentatorsText = '';
            for (const commentator of broadcastInfo.englishCommentators.slice(0, 2)) {
                const starRating = '⭐'.repeat(Math.floor(commentator.rating / 2));
                
                commentatorsText += `🎙️ **${commentator.name}** ${starRating}\n`;
                commentatorsText += `   ┗ ${commentator.channel} • ${commentator.speciality}\n`;
            }
            
            embed.addFields({ name: '🎙️ التعليق الإنجليزي', value: commentatorsText, inline: true });
        }

        // ملاحظة المباريات المجانية
        const hasFreeChannels = 
            (broadcastInfo.arabicChannels && broadcastInfo.arabicChannels.some(ch => ch.is_free)) ||
            (broadcastInfo.englishChannels && broadcastInfo.englishChannels.some(ch => ch.is_free));
        
        if (hasFreeChannels) {
            embed.addFields({
                name: '🆓 مباراة مجانية!',
                value: 'هذه المباراة متاحة على قنوات مجانية',
                inline: false
            });
        }
    }

    // إنشاء embed للقائمة
    static createListEmbed(title, items, color = config.colors.primary) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color);

        if (description && description.trim().length > 0) {
        embed.setDescription(description);
       }
    
        return embed;
   }

        // تجميع العناصر في مجموعات
        const maxFieldLength = 1024;
        let currentField = '';
        let fieldCount = 0;

        for (const item of items) {
            const itemText = typeof item === 'string' ? item : JSON.stringify(item);
            
            if (currentField.length + itemText.length > maxFieldLength) {
                if (currentField) {
                    embed.addFields({ 
                        name: fieldCount === 0 ? 'العناصر' : '\u200b', 
                        value: currentField, 
                        inline: false 
                    });
                    fieldCount++;
                }
                currentField = itemText + '\n';
            } else {
                currentField += itemText + '\n';
            }
        }

        if (currentField) {
            embed.addFields({ 
                name: fieldCount === 0 ? 'العناصر' : '\u200b', 
                value: currentField, 
                inline: false 
            });
        }

        return embed;
    }

    // إنشاء embed للأخطاء
    static createErrorEmbed(message, title = '❌ خطأ') {
        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(message)
            .setColor(config.colors.error)
            .setTimestamp();
    }

    // إنشاء embed للنجاح
    static createSuccessEmbed(message, title = '✅ نجح') {
        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(message)
            .setColor(config.colors.success)
            .setTimestamp();
    }

    // إنشاء embed للتحذير
    static createWarningEmbed(message, title = '⚠️ تحذير') {
        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(message)
            .setColor(config.colors.warning)
            .setTimestamp();
    }

    // إنشاء embed للمعلومات
    createInfoEmbed: (title, description, color = 0x0099ff) => {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color);
    }

    // إنشاء embed للفريق
    static createTeamEmbed(team, isInFavorites = false, nextMatch = null) {
        const flag = config.countryFlags[team.country] || config.countryFlags.default;
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 إحصائيات ${team.team_name}`)
            .setColor(config.colors.primary)
            .addFields(
                { name: '🏟️ الاسم', value: team.team_name, inline: true },
                { name: '🏆 الدوري', value: team.league, inline: true },
                { name: '🏳️ البلد', value: `${team.country} ${flag}`, inline: true }
            );

        if (team.established_year) {
            embed.addFields({ name: '📅 تأسس', value: `${team.established_year}`, inline: true });
        }

        if (isInFavorites) {
            embed.addFields({ name: '⭐ الحالة', value: 'في قائمة مفضلتك', inline: true });
        } else {
            embed.addFields({ name: '➕ إضافة للمفضلة', value: `\`/add_team ${team.team_name}\``, inline: true });
        }

        if (nextMatch) {
            const matchTime = new Date(nextMatch.utcDate);
            const timestamp = Math.floor(matchTime.getTime() / 1000);
            
            embed.addFields({
                name: '🔥 المباراة القادمة',
                value: `⚽ ${nextMatch.homeTeam.name} 🆚 ${nextMatch.awayTeam.name}\n🕐 <t:${timestamp}:R>\n🏆 ${nextMatch.competition.name}`,
                inline: false
            });
        }

        embed.setFooter({ text: '📊 إحصائيات الفريق • محدثة الآن' });
        
        return embed;
    }

    // إنشاء embed للاعب
    static createPlayerEmbed(player, isInFavorites = false) {
        const flag = config.countryFlags[player.nationality] || config.countryFlags.default;
        const positionInfo = config.positions[player.position] || { emoji: '⚽', arabic: player.position };
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 إحصائيات ${player.player_name}`)
            .setColor(config.colors.primary)
            .addFields(
                { name: '👤 الاسم', value: player.player_name, inline: true },
                { name: '🏃‍♂️ المركز', value: `${positionInfo.emoji} ${positionInfo.arabic}`, inline: true },
                { name: '🏟️ النادي', value: player.team_name, inline: true }
            );

        if (player.nationality) {
            embed.addFields({ 
                name: '🏳️ الجنسية', 
                value: `${player.nationality} ${flag}`, 
                inline: true 
            });
        }

        if (player.age) {
            embed.addFields({ name: '🎂 العمر', value: `${player.age} سنة`, inline: true });
        }

        if (player.jersey_number) {
            embed.addFields({ name: '👕 الرقم', value: `#${player.jersey_number}`, inline: true });
        }

        if (player.market_value) {
            embed.addFields({ name: '💰 القيمة السوقية', value: player.market_value, inline: true });
        }

        if (isInFavorites) {
            embed.addFields({ name: '⭐ الحالة', value: 'في قائمة مفضلتك', inline: true });
        } else {
            embed.addFields({ 
                name: '➕ إضافة للمفضلة', 
                value: `\`/add_player ${player.player_name}\``, 
                inline: true 
            });
        }

        embed.addFields({
            name: '📈 الإحصائيات التفصيلية',
            value: '*سيتم إضافة إحصائيات أكثر تفصيلاً قريباً*\n(أهداف، تمريرات، تدخلات، إلخ)',
            inline: false
        });

        embed.setFooter({ text: '💡 استخدم /add_player لإضافته للمفضلة' });
        
        return embed;
    }

    // إنشاء embed للمساعدة
    static createHelpEmbed(page = 1) {
        const embeds = [
            // الصفحة الأولى
            new EmbedBuilder()
                .setTitle('📚 دليل البوت الرياضي الاحترافي')
                .setDescription('مرحباً بك في أقوى بوت رياضي على ديسكورد! 🏆')
                .setColor(config.colors.success)
                .addFields(
                    {
                        name: '⚽ أوامر المباريات الأساسية',
                        value: '• `/matches` - مباريات اليوم (فرقك المفضلة)\n• `/matches show_all:True` - جميع مباريات اليوم\n• `/tomorrow` - مباريات الغد\n• `/upcoming [أيام]` - المباريات القادمة\n• `/live` - المباريات المباشرة\n• `/team_matches [فريق]` - مباريات فريق معين',
                        inline: false
                    },
                    {
                        name: '📺 معلومات البث والتعليق',
                        value: '• `/channels [بطولة]` - القنوات العارضة\n• `/commentators [بطولة]` - أفضل المعلقين\n• `/free_matches` - المباريات المجانية اليوم\n• `/match_details [فريق1] [فريق2]` - تفاصيل مباراة',
                        inline: false
                    }
                )
                .setFooter({ text: 'الصفحة 1/3 • استخدم الأزرار للتنقل' }),

            // الصفحة الثانية
            new EmbedBuilder()
                .setTitle('⭐ إدارة المفضلة')
                .setColor(config.colors.warning)
                .addFields(
                    {
                        name: '🏟️ إدارة الفرق المفضلة',
                        value: '• `/add_team [اسم الفريق]` - إضافة فريق للمفضلة\n• `/remove_team [اسم الفريق]` - إزالة فريق\n• `/my_teams` - عرض فرقك المفضلة\n• `/team_matches [فريق]` - مباريات فريق معين',
                        inline: false
                    },
                    {
                        name: '🏃‍♂️ إدارة اللاعبين المفضلين',
                        value: '• `/add_player [اسم اللاعب]` - إضافة لاعب للمفضلة\n• `/remove_player [اسم اللاعب]` - إزالة لاعب\n• `/my_players` - عرض لاعبيك المفضلين\n• `/player_stats [اسم اللاعب]` - إحصائيات لاعب',
                        inline: false
                    },
                    {
                        name: '💡 فوائد نظام المفضلة',
                        value: '✅ عرض مباريات فرقك المفضلة فقط\n⭐ تمييز الفرق المفضلة بالنجوم\n🔔 تنبيهات مخصصة للمباريات\n📊 إحصائيات شخصية متقدمة',
                        inline: false
                    }
                )
                .setFooter({ text: 'الصفحة 2/3 • استخدم الأزرار للتنقل' }),

            // الصفحة الثالثة
            new EmbedBuilder()
                .setTitle('⚙️ الإعدادات والأوامر المتقدمة')
                .setColor(config.colors.info)
                .addFields(
                    {
                        name: '🎛️ إعدادات الحساب',
                        value: '• `/settings` - عرض إعداداتك الحالية\n• `/settings show_only_favorites:False` - عرض جميع المباريات\n• `/settings notifications:True` - تفعيل التنبيهات\n• `/settings language:en` - تغيير اللغة المفضلة\n• `/my_dashboard` - لوحة التحكم الشخصية',
                        inline: false
                    },
                    {
                        name: '📊 أوامر الإحصائيات',
                        value: '• `/match_stats [match_id]` - إحصائيات مباراة\n• `/player_stats [لاعب]` - إحصائيات لاعب\n• `/my_dashboard` - إحصائياتك الشخصية',
                        inline: false
                    },
                    {
                        name: '🏆 مميزات البوت',
                        value: '🔴 تحديث مباشر كل دقيقتين\n📺 معلومات القنوات والمعلقين\n🆓 تمييز المباريات المجانية\n⭐ نظام مفضلة متقدم\n🌍 دعم متعدد اللغات\n📱 واجهة سهلة الاستخدام',
                        inline: false
                    }
                )
                .setFooter({ text: 'الصفحة 3/3 • البوت الرياضي الاحترافي' })
        ];

        return embeds[page - 1] || embeds[0];
    }

    // إنشاء embed للبداية السريعة
    static createQuickStartEmbed() {
        return new EmbedBuilder()
            .setTitle('🚀 دليل البداية السريعة')
            .setDescription('ابدأ رحلتك مع البوت الرياضي في 3 خطوات بسيطة!')
            .setColor(0x00ff88)
            .addFields(
                {
                    name: '1️⃣ أضف فرقك المفضلة',
                    value: '```/add_team Real Madrid```\n```/add_team Liverpool```\n```/add_team الهلال```\n*هذا سيجعل البوت يعرض مباريات فرقك المفضلة فقط*',
                    inline: false
                },
                {
                    name: '2️⃣ أضف لاعبيك المفضلين',
                    value: '```/add_player Cristiano Ronaldo```\n```/add_player Mohamed Salah```\n*للحصول على إحصائيات وأخبار لاعبيك المفضلين*',
                    inline: false
                },
                {
                    name: '3️⃣ استمتع بالمباريات!',
                    value: '```/matches``` ← مباريات فرقك اليوم\n```/live``` ← المباريات المباشرة\n```/free_matches``` ← المباريات المجانية\n```/my_dashboard``` ← لوحة التحكم الشخصية',
                    inline: false
                },
                {
                    name: '💡 نصائح مفيدة',
                    value: '• استخدم `/matches show_all:True` لعرض جميع المباريات\n• استخدم `/channels Premier League` لمعرفة القنوات العارضة\n• استخدم `/settings` لتخصيص تجربتك\n• استخدم `/help` للدليل الكامل',
                    inline: false
                },
                {
                    name: '🎉 مرحباً بك!',
                    value: 'الآن أنت جاهز لاستخدام أقوى بوت رياضي على ديسكورد! 🏆',
                    inline: false
                }
            )
            .setFooter({ text: '💫 البوت الرياضي الاحترافي • ابدأ الآن!' });
    }

    // إضافة تمييز للفرق المفضلة
    static addFavoriteStars(teamName, favoriteTeams) {
        const isFavorite = favoriteTeams.some(fav => 
            teamName.toLowerCase().includes(fav.team_name.toLowerCase()) ||
            fav.team_name.toLowerCase().includes(teamName.toLowerCase())
        );
        
        return isFavorite ? `${teamName} ⭐` : teamName;
    }
}

module.exports = EmbedUtils;
