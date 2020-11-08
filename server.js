const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
var path = require('path');
var express = require('express');



var expApp = express();
var win;
let isQuiting;
let tray;


app.on('before-quit', function () { //gets called before program's actual quit (which is only possible if forced, or from tray)
  isQuiting = true;
});

app.on('ready', () => {
  tray = new Tray(path.join(__dirname, 'tray.png')); ////setting up the tray and it's options/labels

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show App', click: function () {
        win.show();
      }
    },
    {
      label: 'Quit', click: function () {
        isQuiting = true;
        app.quit();
      }
    }
  ]));

  tray.on('click', function() { //click events for the tray, to open and close on click as required
    if ( win.isVisible() )
    {
      win.hide();
    }
    else if ( win.isVisible() == false )
    {
      win.show();
    }
  })

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  })
  
  // and load the index.html of the app.
  win.loadFile(__dirname + '/static/index.html');
  
  win.webContents.openDevTools();

  // fetch('https://catagory-server-nodejs.herokuapp.com/catagoryList')
  // .then(res => res.json())
  // .then(json => 
  // {
  //   win.webContents.send('catagoryList', json)    
  // });

  
  win.on('close', function (event) { //this stuff is a part of the work meant to send the program to the Tray 
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
      event.returnValue = false;
    }
  });


  // updateCatagoryList(15000);

})


function spawnOptionsMenu()
{
  let child = new BrowserWindow({parent: win, width: 500, height: 300})
  child.loadFile(__dirname + '/static/options.html')

}

function spawnTrackedGameSettings(trackedData)
{
  let trackedSettingsWindow = new BrowserWindow({parent: win, width: 500, height: 300, webPreferences: {nodeIntegration: true}} )
  trackedSettingsWindow.webContents.openDevTools();
  trackedSettingsWindow.loadFile(__dirname + '/static/trackedGameSettings.html') //asdwkasd
  
  setTimeout(() => {
    trackedSettingsWindow.webContents.send('sendId', trackedData);
  }, 250);

  ipcMain.on('closeTrackedGameSettingsWindow', (event, args) => {
    trackedSettingsWindow.destroy();
  })
  
}





// function updateCatagoryList(intervalInSeconds)
// {
//   console.log('now will start update CatagoryList every X amount of seconds');
  
//   setInterval(() => {
//     //get list of catagory(game) names and send it to client
//  fetch('https://catagory-server-nodejs.herokuapp.com/catagoryList')
//  .then(res => res.json())
//  .then(json => 
//  {
//    win.webContents.send('catagoryList', json)    
//  });

//  }, intervalInSeconds);

// }



ipcMain.on('openOptions', (event, args) => {
  spawnOptionsMenu();
})

ipcMain.on('openTrackedSettings', (event, args) => {
  spawnTrackedGameSettings(args);
})

ipcMain.on('trackedGameConditionSettings', (event, args) => {
  console.log('now in main');
  console.log('testing.. id: ' + args.gameId);
  console.log('testing.. viewOption: ' + args.viewOption);
  console.log('testing.. viewCount: ' + args.viewCount);

  win.webContents.send('newConditionSettings', args)    

})

ipcMain.on('requestToRemoveTrackedGame', (event, args) => {
  win.webContents.send('removeTrackedGame', args)    
})
















