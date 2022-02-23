const functions = require("firebase-functions");
const { OPENAI_API_KEY } = require('./secrets')
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey = OPENAI_API_KEY
})

const openai= new OpenAIApi(configuration);

exports.wisetrader = functions.https.onRequest((request, response)=>{

    const gptCompletion = await openai.createCompletion("text-davinci-001", {
        prompt: "Jim Cramer recommends selling the following stocks tickers: ",
        temperature: 0.7,
        max_tokens: 32,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    })

    response.send(gptCompletion.data)
})