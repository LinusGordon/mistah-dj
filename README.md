# mistah-dj     
Build and listen to a playlist with friends through the Mistah DJ Facebook chatbot.      
Through Mistah DJ, Facebook friends across different desktop and mobile devices can add and remove songs to a playlist. The Spotify API is used to get the URI of the desired song and is sent to the Bose API to play through their speakers. Any person at any time can add, remove, play, pause, or replay songs.   

## Mistah DJ received first place at Polyhack 2016 (Tufts' hackathon).     

## Demo Video:     
##### In this demo, one user (onscreen) adds two songs while another offscreen mobile user adds their own song. Together they create a collaborative playlist, that plays through Bose speakers, although you can't hear that in the gif:        

![alt-text](https://github.com/LinusGordon/mistah-dj/blob/master/mistahDJDemo.gif)     

### Removing songs:     

![alt-text](https://github.com/LinusGordon/mistah-dj/blob/master/demo2.png)

     
## Technical details:     
We used:     
- [x] Facebook API for the chatbot     
- [x] Spotify API to retrieve song data     
- [x] Bose API to play/pause songs     
- [x] NGROK to tunnel from our code deployed on Heroku, to our local machine, and then to the Bose Speakers     

