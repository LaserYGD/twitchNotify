const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
var path = require("path");

var win;
let isQuiting;
let tray;
let allowQuit = false;

app.on("before-quit", function (event) {
  //gets called before program's actual quit (which is only possible if forced, or from tray)
  if (allowQuit === false) {
    event.preventDefault();
  }

  isQuiting = true;
  win.webContents.send("trySaveBeforeExitComplete");
  console.log("Before-quit event fired, now quitting....");
});

app.on("ready", () => {
  tray = new Tray(path.join(__dirname, "tray.png")); ////setting up the tray and it's options/labels

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show TwitchNotify",
        click: function () {
          win.show();
        },
      },
      {
        label: "Quit",
        click: function () {
          isQuiting = true;
          // On macOS it is common for applications and their menu bar
          // to stay active until the user quits explicitly with Cmd + Q
          if (process.platform !== "darwin") {
            app.quit();
          }
        },
      },
    ])
  );

  tray.on("click", function () {
    //click events for the tray, to open and close on click as required
    if (win.isVisible()) {
      win.hide();
    } else if (win.isVisible() == false) {
      win.show();
    }
  });

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      //sandbox: true,
    },
    icon: "test2.png",
    title: "twitchNotify",
    resizable: false,
  });

  // and load the index.html of the app.
  win.loadFile(__dirname + "/static/index.html");

  win.webContents.openDevTools();

  // fetch('https://catagory-server-nodejs.herokuapp.com/catagoryList')
  // .then(res => res.json())
  // .then(json =>
  // {
  //   win.webContents.send('catagoryList', json)
  // });

  win.on("close", function (event) {
    //this stuff is a part of the work meant to send the program to the Tray
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
      event.returnValue = false;
    }
  });

  // updateCatagoryList(15000);
});

function spawnOptionsMenu() {
  let child = new BrowserWindow({ parent: win, width: 500, height: 300 });
  child.loadFile(__dirname + "/static/options.html");
}

function spawnTrackedGameSettings(trackedData) {
  let trackedSettingsWindow = new BrowserWindow({
    parent: win,
    width: 350,
    height: 350,
    webPreferences: { nodeIntegration: true },
  });
  trackedSettingsWindow.webContents.openDevTools();
  trackedSettingsWindow.loadFile(__dirname + "/static/trackedGameSettings.html");

  setTimeout(() => {
    trackedSettingsWindow.webContents.send("sendId", trackedData);
  }, 250);

  ipcMain.on("closeTrackedGameSettingsWindow", (event, args) => {
    trackedSettingsWindow.destroy();
  });
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

ipcMain.on("openOptions", (event, args) => {
  spawnOptionsMenu();
});

ipcMain.on("openTrackedSettings", (event, args) => {
  spawnTrackedGameSettings(args);
});

ipcMain.on("trackedGameConditionSettings", (event, args) => {
  console.log("now in main");
  console.log("testing.. id: " + args.gameId);
  console.log("testing.. viewOption: " + args.viewOption);
  console.log("testing.. viewCount: " + args.viewCount);
  console.log("testing.. cooldownFromUser: " + args.cooldownValueFromUser);

  win.webContents.send("newConditionSettings", args);
});

ipcMain.on("requestToRemoveTrackedGame", (event, args) => {
  win.webContents.send("removeTrackedGame", args);
});

ipcMain.on("openLinkExternal", (event, args) => {
  var open = require("open"); //this opens a link using external default browser on notifcation click
  let url = "https://www.twitch.tv/directory/game/" + args;
  open(url);
});

ipcMain.on("exitApp", (event, args) => {
  //this is being used to make sure the application saves settings on exit
  allowQuit = true;
  app.quit();
});
