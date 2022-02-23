const functions = require("firebase-functions");

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey = process.env.OPENAI_API_KEY
})


