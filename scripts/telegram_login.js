const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // npm install input

// You need to get these from https://my.telegram.org/
const apiId = parseInt(process.env.TELEGRAM_API_ID || input.text('Enter your API_ID: '));
const apiHash = process.env.TELEGRAM_API_HASH || input.text('Enter your API_HASH: ');
const stringSession = new StringSession(""); // Empty session

(async () => {
    // If not provided in .env, ask now
    const id = apiId || await input.text('Enter API_ID: ');
    const hash = apiHash || await input.text('Enter API_HASH: ');

    const idNum = parseInt(id);
    const client = new TelegramClient(stringSession, idNum, hash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Please enter your number (+66xxxxxxx): "),
        password: async () => await input.text("Please enter your password (if any): "),
        phoneCode: async () => await input.text("Please enter the code you received: "),
        onError: (err) => console.log(err),
    });

    console.log("You should now be connected.");
    console.log("Save this string as TELEGRAM_SESSION in your .env file:");
    console.log("");
    console.log(client.session.save()); 
    console.log("");
    process.exit(0);
})();
