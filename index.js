const { Client, Events, GatewayIntentBits } = require("discord.js")
require("dotenv/config")
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY 
})

const client = new Client({
    //What bot is capible of seeing
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

//Create client and look for ready event
client.once(Events.ClientReady, (clientUser) => {
    console.log(`Logged in as ${clientUser.user.tag}`)
})

//Login with passed in token
client.login(process.env.BOT_TOKEN)

//Specific channel
const BOT_CHANNEL= "Your Bot Channel ID"

//Number of messages to look at beforehand in the conversation
const PAST_MESSAGES = 5

//Bot listening to messages
client.on(Events.MessageCreate, async (message) => {
    
    //Make sure message is not from bot
    if (message.author.bot)
    {
        return
    }

    //Makes sure message is in certain channel
    if (message.channel.id !== BOT_CHANNEL)
    {
        return
    }

    //Display text that the bot is typing
    message.channel.sendTyping()

    //Fetch messages, make an array because fetch creates a collection that is hard to use 
    //Array allows us to have message id and message content
    let messages = Array.from(await message.channel.messages.fetch({
        limit: PAST_MESSAGES,
        //retrieve everything that came before current message
        before: message.id
    }))

    //Format data
    messages = messages.map(m => m[1])

    //Adds message to begining of messages array
    messages.unshift(message)

    //Gets name of all users involved
    let users = [...new Set([...messages.map(m=> m.member.displayName), client.user.username])]

    //Grabs last user
    let lastUser = users.pop()

    let prompt = `The following is a conversation between ${users.join(", ")}, and ${lastUser}. \n\n`

    //Messages array grabs messages in reverse chronological order, reverse the order
    for (let i = messages.length - 1; i >= 0; i--)
    {
        const m = messages[i]
        prompt += `${m.member.displayName}: ${m.content}\n`
    }

    prompt += `${client.user.username}:`
    console.log("prompt:", prompt)

    //Make call to open ai
    const reponse = await openai.completions.create({
        prompt,
        model: "gpt-3.5-turbo-instruct",
        //restricts length of reply
        max_tokens: 500,
        stop: ["\n"]
        
    })

    //loggs responses
    console.log("response", reponse.choices[0].text)
    await message.channel.send(reponse.choices[0].text)
})