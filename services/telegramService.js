const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION || ""); // saved session string

let client = null;

async function initTelegramClient() {
    if (!apiId || !apiHash || !process.env.TELEGRAM_SESSION) {
        console.warn('⚠️  Telegram API ID, Hash, or Session is missing. Telegram uploads will not work.');
        return;
    }

    client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    
    await client.connect();
    console.log('✅ Telegram Client Connected.');
}

async function uploadFileToTelegram(filePath, fileName, caption = '') {
    if (!client) throw new Error('Telegram client not initialized.');
    
    // Using simple sendFile for user bots
    const result = await client.sendFile('me', {
        file: filePath,
        caption: caption || fileName,
        forceDocument: true,
        workers: 4 // For faster upload
    });
    
    return result.id; // Message ID in Saved Messages
}

async function downloadFileFromTelegram(messageId, destPath) {
    if (!client) throw new Error('Telegram client not initialized.');
    
    // Get the message from Saved Messages ('me')
    const messages = await client.getMessages('me', { ids: [parseInt(messageId)] });
    if (!messages || messages.length === 0 || !messages[0].media) {
        throw new Error('Message or Media not found in Telegram.');
    }
    
    const media = messages[0].media;
    const buffer = await client.downloadMedia(media, {
        workers: 1, // Reduced to 1 to prevent 'FloodWait' rate limit from Telegram!
    });
    
    if (!buffer) throw new Error('Failed to download media.');
    
    fs.writeFileSync(destPath, buffer);
    return destPath;
}

module.exports = {
    initTelegramClient,
    uploadFileToTelegram,
    downloadFileFromTelegram
};
