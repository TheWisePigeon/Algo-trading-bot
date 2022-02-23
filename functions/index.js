const functions = require("firebase-functions");
const puppeteer = require('puppeteer')
const Alpaca = require('@alpacahq/alpaca-trade-api')
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey : process.env.OPENAI_API_KEY
})

const openai= new OpenAIApi(configuration);

const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY,
    secretKey: process.env.ALPACA_SECRET,
    paper:true
})

exports.wisetrader = functions.https.onRequest( async (request, response)=>{

    const tweets = await scrape()

    const gptCompletion = await openai.createCompletion("text-davinci-001", {
        prompt: ` ${tweets} Jim Cramer recommends selling the following stocks tickers: `,
        temperature: 0.7,
        max_tokens: 32,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    })

    const stocksToBuy = gptCompletion.data.choices[0].text.match(/\b[A-Z]+\b/g)

    const account= await alpaca.getAccount()
    console.log(`test: ${account.buying_power}`);

    const order = await alpaca.createOrder({
        symbol: stocksToBuy[0],
        notional: account.buying_power * 0.9,
        side: 'buy',
        type: 'market',
        time_in_force: 'day'

    });

    response.send(order)
})

async function scrape() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto('https://twitter.com/jimcramer',  {
        waitUntil: 'networkidle2'
    })

    await page.waitForTimeout(3000)

    await page.screenshot({path: 'example.png'})

    const tweets = await page.evaluate(async () => {
      return document.body.innerText
    })

    await browser.close()

    return tweets
}

