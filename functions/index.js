const functions = require("firebase-functions");
const Alpaca = require('@alpacahq/alpaca-trade-api')
const {
    Configuration,
    OpenAIApi
} = require('openai');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration);

const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY,
    secretKey: process.env.ALPACA_SECRET,
    paper: true
})



// async function scrape() {
//     const browser = await puppeteer.launch()
//     const page = await browser.newPage()

//     await page.goto('https://twitter.com/jimcramer',  {
//         waitUntil: 'networkidle2'
//     })

//     await page.waitForTimeout(3000)

//     await page.screenshot({path: 'example.png'})

//     const tweets = await page.evaluate(async () => {
//       return document.body.innerText
//     })

//     await browser.close()

//     return tweets
// }

exports.WiseTrader = functions.runWith({
        memory: '2GB'
    }).pubsub
    .schedule('0 7 * * 1-5')
    .timeZone('Europe/London')
    .onRun(async (ctx) => {
        console.log('The wise trader is on');

        const gptCompletion = await openai.createCompletion("text-davinci-001", {
            prompt: ` Jim Cramer recommends selling the following stocks tickers: `,
            temperature: 0.7,
            max_tokens: 32,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        })

        const stocksToBuy = gptCompletion.data.choices[0].text.match(/\b[A-Z]+\b/g)
        console.log(`Advice reveived: ${stocksToBuy} `);
        if (!stocksToBuy) {
            console.log("No advicetoday :(");
            return null
        }

        const cancel = await alpaca.cancelAllOrders()
        const liquidate = await alpaca.closeAllPositions()

        const account = await alpaca.getAccount()
        console.log(`Buying power: ${account.buying_power}`);

        const order = await alpaca.createOrder({
            symbol: stocksToBuy[0],
            notional: account.buying_power * 0.025,
            side: 'buy',
            type: 'market',
            time_in_force: 'day'

        });

        console.log(`Stonks bought: ${order.id}`);

        return null
    })