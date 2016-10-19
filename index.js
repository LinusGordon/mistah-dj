'use strict'

var  $;

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

require("jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }

    $ = require("jquery")(window);
});

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const IP_ADDRESS = "http://b49a8572.ngrok.io";
console.log(IP_ADDRESS);
const SPOTIFY_USERNAME = "linusbose";

var playlist = [];
var songImages = [];
var currentSong;
var paused; // flag for paused or not
var songNumber; // keeps track of where we are in playlist
var songImage;
var song;
var volume;

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



function get_uri(song){
        if(song !== undefined) {
                song = song.replace(/ /g,"%20");
        }
                var songRequest = new XMLHttpRequest();
                                // Step 2: Make request to remote resource
                                // NOTE: https://messagehub.herokuapp.com has cross-origin resource sharing enabled
                songRequest.open("get", "https://api.spotify.com/v1/search?q=" + song + "&type=track", false);
                songRequest.send();     
                songRequest.onreadystatechange = function() {
                        //console.log(songRequest.readyState);
                        if(songRequest.readyState == 4) {
                                var obj = JSON.parse(songRequest.responseText);
                                if(obj.tracks.items[0] == undefined) {
                                    console.log("Not a song.");
                                } else {
                                    //console.log(obj.tracks.items[0].uri);
                                    //songImage = obj.tracks.items.art['$t'];
                                    var songContent = '<ContentItem source="SPOTIFY" type="uri" location="' + obj.tracks.items[0].uri + '" sourceAccount="12173067090"></ContentItem>'
                                    // var songContent = '{\
                                    //   "ContentItem": {\
                                    //     "source": "SPOTIFY",\
                                    //     "type": "uri",\
                                    //     "location": "' + obj.tracks.items[0].uri + '",\
                                    //     "sourceAccount": "linusbose"\
                                    //   }\
                                    // }';

                                    currentSong = songContent;  
                                }
                        }
                }

        
  }


app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
                if(playlist.length === 0) {
                        volume = 50;
                        songNumber = 0;
                }
            let text = event.message.text.toLowerCase();
            text = text.replace(/[.,\/#!$%\^&\*;:{?}=\-_`~()]/g,""); // Remove all non-alphanumeric characters except ?
            if(text.endsWith("playlist")) {
                        getArtwork(text);
                        sendPlaylistCards(sender);
            } else if(text.startsWith("add") && !text.startsWith("added")) {
                        text = text.replace(/the song/g,''); // remove "the song" from string
                        song = text.substr(text.indexOf("add") + 3, text.length);
                        playlist.push(song);

                        sendTextMessage(sender, "Added" + song + " to playlist.");
            } else if(text.startsWith("remove")) {
                        text = text.replace(/remove/g,'');
                        text = text.replace(/the song/g,''); // remove "the song" from string
                        removeSong(sender, text);
            } else if(text.startsWith("clear")) { // clear the playlist
                        volume = 50;
                        songNumber = 0;
                        clearPlaylist();
                        sendTextMessage(sender, "Playlist count is now: " + playlist.length);
            } else if(text.startsWith("hey") || text.startsWith("hi")) { // greeting
                        sendTextMessage(sender, "Hey! I'm Mistah DJ. If you need help please type 'help.'");
            } else if(text.startsWith("sup") || text.startsWith("watsup") || text.startsWith("whats up") || text.startsWith("whatsup")) { // for fun
                        sendTextMessage(sender, "sup");
            } else if(text.startsWith("help")) { // help menu
                        var output = "To add a song, type 'add [song name]'\n";
                        output += "To remove a song type 'remove [song name]\n";
                        output += "To see your playlist type 'playlist'\n";
                        output += "To clear your playlist type 'clear'\n";
                        output += "To play your playlist, type 'play'\n";
                        output += "To pause your playlist, type 'pause'\n";
                        output += "Volume [up/down]\n";
                        output += "For more about me type 'more'\n";
                                        sendTextMessage(sender, output);
            } else if(text.startsWith("more")) { // more
                        sendTextMessage(sender, "My name is Mistah DJ. I was built at Tufts Polyhack 2016.")
            } else if(text.startsWith("play") && text.indexOf("playlist") == -1) { // play song
                        if(playlist.length > 0) {
                                        get_uri(playlist[songNumber]);
                                        playSong();
                                        sendPlaylistCards(sender);
                        }
                        else {
                                sendTextMessage(sender, "There's nothing in your playlist to play!")
                        }
            } else if(text.startsWith("pause")) { // pause the song
                        pauseSong();
                        sendTextMessage(sender, "Paused.");
            } else if(text.startsWith("next song") || text.startsWith("play next song")) { // user wants to play the next song
                        if(songNumber === playlist.length - 1) {
                                sendTextMessage(sender, "You are currently listening to the last song. Add more!");
                        } else {
                                songNumber++;
                                get_uri(playlist[songNumber + 1]);
                                playSong();
                        }
            } else if(text.indexOf("previous song") !== -1) { // user wants to play the previous song
                        if(songNumber === 0) {
                                sendTextMessage(sender, "Sorry, you are currently listening to the first song.")
                        } else {
                                songNumber--;
                                get_uri(playlist[songNumber - 1]);
                                playSong();
                        } 
            } else if(text.indexOf("volume up") !== -1) {
                if(volume <= 90) {
                    volume += 10;
                }
                sendTextMessage(sender, "Volume set to: " + (volume / 10) + "/10");
                changeVolume();
            } else if(text.indexOf("volume down") !== -1) {
                if(volume >= 10) {
                    volume -= 10;
                }
                sendTextMessage(sender, "Volume set to: " + (volume / 10) + "/10")
                changeVolume();
            } else {
                        sendTextMessage(sender, "You said: " + text.substring(0, 200) + " That command is currently unavailable.");
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

function printPlaylist(sender) {
        if(playlist.length == 0) {
                sendTextMessage(sender, "Sorry! There's nothing in your playlist!");
        }
        var output = "";
        for(var i = 0; i < playlist.length; i++) {
                output += (i + 1) + ") " + playlist[i] + "\n";
        }
        sendTextMessage(sender, output);

}

function clearPlaylist() {
        playlist = [];
}

function removeSong(sender, song) {
        var found = false;
        for(var i = 0; i < playlist.length; i++) {
                if(playlist[i] === song) {
                        playlist.splice(i, 1);
                        sendTextMessage(sender, "Removed!");
                        found = true;
                }
        }
        if(!found) {
                sendTextMessage(sender, "Could not find '" + song + " ' to remove from playlist.");
        }
}

function playSong() {
        console.log("IN PLAY SONG");
        console.log(currentSong);
        $.ajax({
            url: 'http://b49a8572.ngrok.io/select',
            data: currentSong, 
            type: 'POST',
            contentType: "text/xml",
            dataType: "text",
            error : function (xhr, ajaxOptions, thrownError){  
                console.log(xhr.status);          
                console.log(thrownError);
            } 
        }); 
        // $.ajax({
        //         url: "http://3eb0e343.ngrok.io/select",
        //         type: "POST",
        //         contentType: "application/json; charset=utf-8",
        //         data: currentSong,
        //         error: function(XMLHttpRequest, textStatus, errorThrown) {
        //                 console.log(errorThrown);
        //         },
        //         success: function(data, textStatus) {
        //                 console.log("success");
        //         },
        //         complete: function(XMLHttpRequest, textStatus) {
        //                 console.log("success");
        //         }
        // });

   paused = false; 
}

function pauseSong() {
        $.ajax({
                url: "http://b49a8572.ngrok.io/key",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                data: '<key state="press" sender="Gabbo">PAUSE</key>',
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                        console.log(errorThrown);
                },
                success: function(data, textStatus) {
                        console.log(data);
                },
                complete: function(XMLHttpRequest, textStatus) {
                        //onEndAjax();
                }
        });
        // $.ajax({
        //         url: "http://28eca88d.ngrok.io/key",
        //         type: "POST",
        //         contentType: "application/json; charset=utf-8",
        //         data: '{\
        //                   "key": {\
        //                     "state": "press",\
        //                     "sender": "Gabbo",\
        //                     "value": "PAUSE"\
        //                 }\
        //         }',
        //         error: function(XMLHttpRequest, textStatus, errorThrown) {
        //                 console.log(errorThrown);
        //         },
        //         success: function(data, textStatus) {
        //                 console.log(data);
        //         },
        //         complete: function(XMLHttpRequest, textStatus) {
        //                 //onEndAjax();
        //         }
        // })
        paused = true;
        // Bose Speaker API
        // same as above but pause
}

function sendPlaylistCards(sender) {
    if(playlist.length > 0) {
        song = song.replace(/\w\S*/g, function(song){return song.charAt(0).toUpperCase() + song.substr(1).toLowerCase();});
        var messageData = { "attachment": { "type": "template", "payload": { "template_type": "generic", "elements" : []} } };
        for(var i = songNumber; i < playlist.length; i++) {
                var curSong = playlist[i];
                curSong = curSong.replace(/\w\S*/g, function(curSong){return curSong.charAt(0).toUpperCase() + curSong.substr(1).toLowerCase();});
                if(i == songNumber) {
                    var jsonData = { "title": curSong, "subtitle": "Now playing", "image_url": songImages[i], "buttons": [{ "type": "web_url", "url": "https://linusgordon.github.io/mistah-dj", "title": "Mistah DJ Homepage" }], };
                } else {
                        console.log(songImages[i]);
                        var jsonData = { "title": curSong, "subtitle": "Coming up soon", "image_url": songImages[i], "buttons": [{ "type": "web_url", "url": "https://linusgordon.github.io/mistah-dj", "title": "Mistah DJ Homepage" }], };
                }
                messageData.attachment.payload.elements.push(jsonData);
                
        // let messageData = {
        //     "attachment": {
        //         "type": "template",
        //         "payload": {
        //             "template_type": "generic",
        //             "elements": [{
        //                 "title": song,
        //                 "subtitle": "Now playing",
        //                 "image_url": 'https://d13yacurqjgara.cloudfront.net/users/244516/screenshots/2227243/dj.gif',
        //                 "buttons": [{
        //                     "type": "web_url",
        //                     "url": "https://linusgordon.github.io/mistah-dj",
        //                     "title": "Mistah DJ Homepage"
        //                 }],
        //             }]
        //         }
        //     }
        // }
        }
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
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            }
        });
    } else {
        sendTextMessage(sender, "Sorry, there's nothing in your playlist!")
    }
}

function changeVolume() {
    $.ajax({
                url: "http://b49a8572.ngrok.io/volume",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                data: '<volume>' + volume + '</volume>',
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                        console.log(errorThrown);
                },
                success: function(data, textStatus) {
                        console.log(data);
                },
                complete: function(XMLHttpRequest, textStatus) {
                        //onEndAjax();
                }
        });
}

function getArtwork(song) {
        if(song !== undefined) {
                song = song.replace(/ /g,"%20");
        }
                var songRequest = new XMLHttpRequest();
                                // Step 2: Make request to remote resource
                                // NOTE: https://messagehub.herokuapp.com has cross-origin resource sharing enabled
                songRequest.open("get", "https://api.spotify.com/v1/search?q=" + song + "&type=track", false);
                songRequest.send();     
                songRequest.onreadystatechange = function() {
                        //console.log(songRequest.readyState);
                        if(songRequest.readyState == 4) {
                                var obj = JSON.parse(songRequest.responseText);
                                if(obj.tracks.items[0] == undefined) {
                                    console.log("Not a song.");
                                } else {
                                    //console.log(obj.tracks.items[0]);
                                    if(obj.tracks.items[0].album != undefined) {
                                        if(obj.tracks.items[0].album.images != undefined) {
                                            songImage = obj.tracks.items[0].album.images[0].url;
                                            songImage = songImage.replace(/https/g,"http");
                                            console.log("artwork = ", songImage);
                                            songImages.push(songImage);
                                         }
                                         else 
                                            console.log("NO ARTWORK");
                                    }
                                }
                        }
                }

        
  }
}


