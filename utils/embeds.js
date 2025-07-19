const { EmbedBuilder } = require('discord.js');

const EmbedUtils = {
    createInfoEmbed: (title, description = null, color = 0x0099ff) => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color);
            
        if (description && typeof description === 'string' && description.trim().length > 0) {
            embed.setDescription(description);
        }
        
        return embed;
    },
    
    createSuccessEmbed: (description, title = '✅ نجح') => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(0x00ff00);
            
        if (description && description.trim().length > 0) {
            embed.setDescription(description);
        }
        
        return embed;
    },
    
    createErrorEmbed: (description, title = '❌ خطأ') => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(0xff0000);
            
        if (description && description.trim().length > 0) {
            embed.setDescription(description);
        }
        
        return embed;
    },
    
    createWarningEmbed: (description, title = '⚠️ تحذير') => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(0xff9900);
            
        if (description && description.trim().length > 0) {
            embed.setDescription(description);
        }
        
        return embed;
    }
};

module.exports = EmbedUtils;
