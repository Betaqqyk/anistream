require('dotenv').config();
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');

const OTP = process.argv[2];
if (!OTP) {
    console.error("Please provide OTP as argument");
    process.exit(1);
}

(async () => {
    try {
        const apiId = 38282553;
        const apiHash = 'cc40180f566bcf089a8857232bfca3dc';
        
        const { phoneCodeHash, sessionStr } = JSON.parse(fs.readFileSync('telegram_temp.json'));
        const client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, { connectionRetries: 5 });
        
        await client.connect();
        
        console.log(`Verifying OTP: ${OTP}...`);
        await client.invoke(new Api.auth.SignIn({
            phoneNumber: '+66984354083',
            phoneCodeHash,
            phoneCode: OTP
        }));
        
        console.log("\n==== นำข้อความด้านล่างนี้ไปใส่ในไฟล์ .env ตัวแปร TELEGRAM_SESSION ====\n");
        console.log(client.session.save());
        console.log("\n======================================================================\n");
        
        if (fs.existsSync('telegram_temp.json')) fs.unlinkSync('telegram_temp.json');
        process.exit(0);
    } catch (err) {
        if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
            console.error("❌ บัญชีนี้มีการตั้ง 2-Step Verification ต้องใส่รหัส 2FA ด้วย ให้แจ้งทีมงาน");
        } else {
            console.error("❌ Error:", err.errorMessage || err);
        }
        process.exit(1);
    }
})();
