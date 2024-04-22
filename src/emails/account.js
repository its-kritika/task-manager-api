const mailgun = require("mailgun-js");

const domain = process.env.MAILGUN_DOMAIN
const api_key = process.env.MAILGUN_API_KEY

const mg = mailgun({apiKey: api_key, domain });

const sendWelcomeEmail = (email, name) => {

    const data = {
        from: `kritika@${domain}`,
        to: email,
        subject: 'Thanks for logging in!',
        text: `Welcome to the Task App ${ name }. Let me know how you get along with the app!`
    }

    mg.messages().send(data)
}

const sendGoodByeEmail = (email, name) => {
    const data = {
        from : `kritika@${domain}`,
        to : email,
        subject : 'You are logged out of Task App!',
        text : `Share your feedback ${name}! What else could have we done to keep you onboard?`
    }

    mg.messages().send(data)
}

module.exports = {
    sendWelcomeEmail,
    sendGoodByeEmail
}