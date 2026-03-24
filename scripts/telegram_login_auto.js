require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

(async () => {
    const apiId = 38282553;
    const apiHash = 'cc40180f566bcf089a8857232bfca3dc';
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
    
    console.log("⏳ กำลังเชื่อมต่อ Telegram และขอรหัส OTP สำหรับเบอร์ +66984354083...");
    
    await client.start({
        phoneNumber: '+66984354083',
        password: async () => await ask("\n[2FA] หากมีการตั้งรหัส 2-Step Verification กรุณาใส่รหัสผ่าน (ถ้าไม่มีให้กดข้าม):\n"),
        phoneCode: async () => await ask("\n[OTP] กรุณาใส่รหัสยืนยัน 5 หลักที่ได้รับในแอป Telegram:\n"),
        onError: (err) => console.log(err),
    });
    
    console.log("\n==== นำข้อความด้านล่างนี้ไปใส่ในไฟล์ .env ตัวแปร TELEGRAM_SESSION ====\n");
    console.log(client.session.save());
    console.log("\n======================================================================\n");
    process.exit(0);
})();
