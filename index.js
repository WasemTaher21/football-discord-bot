const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});


const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./database/database');
const config = require('./config/config');

// إنشاء عميل البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// مجموعة الأوامر
client.commands = new Collection();

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = require(filePath);
    
    // التعامل مع الملفات التي تحتوي على أوامر متعددة
    if (typeof commandModule === 'object' && commandModule.data && commandModule.execute) {
        // أمر واحد في الملف
        client.commands.set(commandModule.data.name, commandModule);
        console.log(`✅ تم تحميل الأمر: ${commandModule.data.name}`);
    } else if (typeof commandModule === 'object') {
        // أوامر متعددة في الملف
        for (const [key, command] of Object.entries(commandModule)) {
            if (command && command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`✅ تم تحميل الأمر: ${command.data.name} من ${file}`);
            }
        }
    } else {
        console.log(`⚠️ تحذير: الملف ${file} لا يحتوي على أوامر صحيحة`);
    }
}

// الأحداث
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`🎉 البوت جاهز! تم تسجيل الدخول باسم ${readyClient.user.tag}`);
    
    // تهيئة قاعدة البيانات
    try {
        await initializeDatabase();
        console.log('📊 تم تهيئة قاعدة البيانات بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    }
    
    // تحديث حالة البوت
    client.user.setActivity('⚽ مباريات اليوم | /help', { type: 'WATCHING' });
    
    // مزامنة الأوامر مع Discord
    try {
        console.log('🔄 بدء مزامنة أوامر التطبيق...');
        await client.application.commands.set(
            client.commands.map(command => command.data.toJSON())
        );
        console.log('✅ تم مزامنة أوامر التطبيق بنجاح');
    } catch (error) {
        console.error('❌ خطأ في مزامنة الأوامر:', error);
    }
});

// معالج الأوامر
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ لا يوجد أمر مطابق لـ ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`❌ خطأ في تنفيذ الأمر ${interaction.commandName}:`, error);
        
        const errorMessage = 'حدث خطأ أثناء تنفيذ هذا الأمر!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

// معالج الأخطاء
client.on(Events.Error, error => {
    console.error('❌ خطأ في البوت:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ رفض غير معالج:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ استثناء غير معالج:', error);
    process.exit(1);
});

// إيقاف البوت بشكل صحيح
process.on('SIGINT', () => {
    console.log('🛑 إيقاف البوت...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 إنهاء البوت...');
    client.destroy();
    process.exit(0);
});

// تسجيل الدخول إلى Discord
client.login(process.env.DISCORD_TOKEN);

module.exports = client;