require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

(async () => {
    try {
        const apiId = 38282553;
        const apiHash = 'cc40180f566bcf089a8857232bfca3dc';
        const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
        
        console.log("⏳ กำลังเชื่อมต่อ Telegram และขอรหัส OTP สำหรับเบอร์ +66984354083...");
        await client.connect();
        
        const result = await client.sendCode({ apiId, apiHash }, '+66984354083');
        const sessionStr = client.session.save();
        fs.writeFileSync('telegram_temp.json', JSON.stringify({ phoneCodeHash: result.phoneCodeHash, sessionStr }));
        
        console.log("✅ OTP sent successfully. Waiting for user input.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
})();
