'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

var count;

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
});

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text = event.message.text;
            if(text.startsWith("Set count to")) {
            	count = text.substr(text.length - 1);
            	sendTextMessage(sender, "The count is " + text.substring(0,200));
            } else if(text == "what is the count?") {
            	sendTextMessage(sender, "The count is " + count);
            }
            else {
            	sendTextMessage(sender, "You said: " + text.substring(0, 200));
            }
        }
    }
    res.sendStatus(200);
})

const token = "EAAX69ApMuKUBAEZCDeqvhVE2HBlM6os23ZBdal4hrxePhy0qQWZCDcsFWPw08nYRaezN9kc4p53isCB4stxr9beSXcZCWzV7PVDS2KD6LCkeeXCjlAEMYf7gTIP5sUZBxdPMGVDkEw1tY8raOYtR1ee6OCVKR9TddFGQZAspk5awZDZD";

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}
