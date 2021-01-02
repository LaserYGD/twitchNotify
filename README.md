# twitchNotify
 
Lets you set conditions for any twitch category based on views, and if true, sends you a notification. By default uses a websocket to connect to a database that sends back an array of objects, containing 700 categories (from highest views to lowest). The database updates every 4 minutes, the application detects when the database has newer data and updates to it as well. 
