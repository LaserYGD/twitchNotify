const { ipcRenderer, webContents } = require("electron");
const Store = require("electron-store");
const store = new Store();

let activeGames = [];
let fullGameData = [];
const saveInterval = 20000;
let shouldWeRunAddNamesFunction = true;
const PROGRAM_NAME = "twitchNotify";
const PROGRAM_VERSION = 0.8;
let permissionToAskUserToUpdate = true;

function addNamesToSearchList(data) {
  let searchList = document.getElementById("searchList");

  for (var i = 0; i < data.length; i++) {
    // Create DOM element
    var li = document.createElement("li");

    li.addEventListener("click", getNameOnClick, false);

    // Set text of element
    li.textContent = data[i].name;
    li.name = data[i].name;
    li.id = data[i].id;
    li.className = data[i].id + "SS";
    li.views = data[i].views;

    // Append this element to its parent
    searchList.appendChild(li);
    hideOrUnhideAttribute("hide", "searchList");
  }

  unblockSearchInput(); //once searchList is loaded, then unblock input
}

function openOptions() {
  //it is being used from a button onkey event
  ipcRenderer.send("openOptions");
}

function searchFilter() {
  // it is being used
  // Declare variables
  var input, searchInput, ul, li, i, txtValue;
  var lis = document.getElementById("searchList").getElementsByTagName("li");

  input = document.getElementById("searchInput");
  //searchInput variable is the one containing the text inside of search
  searchInput = input.value.toUpperCase();
  ul = document.getElementById("searchList");
  li = ul.getElementsByTagName("li");
  //console.log(searchInput);

  let gameCountIterator = 0;
  const LIST_OF_GAMES_TO_SHOW = 6;
  // Loop through all list items, and hide those who don't match the search query
  if (searchInput.length > 0) {
    hideOrUnhideAttribute("unhide", "searchList");
    for (i = 0; i < lis.length; i++) {
      txtValue = lis[i].innerHTML;
      if (txtValue.toUpperCase().indexOf(searchInput) > -1 && gameCountIterator < LIST_OF_GAMES_TO_SHOW) {
        li[i].style.display = "";
        gameCountIterator += 1;
      } else {
        li[i].style.display = "none";
      }
    }
  } else {
    hideOrUnhideAttribute("hide", "searchList");
  }
}

function clearSearchInput() {
  var input, searchInput;

  input = document.getElementById("searchInput");
  input.value = "";
  searchFilter();

  //searchInput variable is the one containing the text inside of search
  //searchInput = input.value.toUpperCase();
}

function getNameOnClick() {
  //gets triggered by onclick in the search list, upon being clicked this function will add the game to the TrackedList
  let gameName = this.name;
  let gameId = this.id;

  if (doesGameIdExistInArray(gameId) == true) {
    console.log("IN getNameOnClick(), gameId does exist! exiting function....");
    return;
  }

  activeGames.push({
    name: gameName,
    id: gameId,
    isCooldownEnabled: false,
    cooldownCounter: 0,
    cooldownValue: 4500000, //75 minutes
    disableVisualCooldown: function () {
      if (this.isCooldownEnabled == false) {
        disableVisualCooldown(this.id);
      }
    },
  });

  hideOrUnhideAttribute("hide", gameId);

  let trackedGamesList = document.getElementById("trackedGamesList");

  var li = document.createElement("li");
  li.textContent = gameName;
  li.id = gameId;
  trackedGamesList.appendChild(li);

  const svgIcon = `<ion-icon id='${gameId}' name="settings-outline" onclick="trackedGameConditions(this)"></ion-icon>`;
  svgIcon.id = gameId;

  let trackedGameElement = document.getElementById(gameId);
  trackedGameElement.innerHTML += svgIcon;

  saveTrackedGamesToFile();
  clearSearchInput();
}

function doesGameIdExistInArray(gameId) {
  //pass a gameId to this, and it will check if activeGames has it. Returns boolean
  for (let i = 0; i < activeGames.length; ++i) {
    if (activeGames[i].id == gameId) {
      console.log("returning true...");
      return true;
    }
  }

  console.log("returning false...");
  return false;
}

function unblockSearchInput() {
  //we run this once we successfully connect to the database and load search names
  document.getElementById("searchInput").disabled = false;
}

function hideOrUnhideAttribute(commandInString, idName) {
  //'hide' to hide, 'unhide' to unhide. Crazy i know.
  let htmlElement = document.getElementById(`${idName}`);
  let command = commandInString.toLowerCase();

  if (command === "hide") {
    htmlElement.hidden = "hidden";
  } else if (command === "unhide") {
    htmlElement.hidden = "";
  }
}

function GetElementInsideContainer(containerID, childID) {
  var elm = document.getElementById(childID);
  var parent = elm ? elm.parentNode : {};
  return parent.id && parent.id === containerID ? elm : {};
}

function findArrayElementByGameId(gameId, array) {
  //get index of array element using gameid
  console.log(array);
  for (let i = 0; i < array.length; ++i) {
    if (array[i].id == gameId) {
      return i;
    }
  }
}

function trackedGameConditions(state) {
  //being used by OnKey
  console.log(activeGames);
  openTrackedSettingsWindow(state.id);

  //let test = activeGames.find(x => x.id === state.id).viewChoice = 'over';
}

function openTrackedSettingsWindow(id) {
  //it is being used from a button onkey event
  ipcRenderer.send("openTrackedSettings", id);
}

function addConditionSettings(gameData) {
  //adds conditions to a game, requires the game's ID to find it
  activeGames.find((x) => x.id === gameData.gameId).viewOption = gameData.viewOption;
  activeGames.find((x) => x.id === gameData.gameId).viewCount = gameData.viewCount;
  activeGames.find((x) => x.id === gameData.gameId).cooldownValue = gameData.cooldownValue;
  activeGames.find((x) => x.id === gameData.gameId).hasConditions = true;

  setTimeout(() => {
    saveTrackedGamesToFile();
  }, 200);
}

function doConditionCheck(trackedGameObject) {
  //check tracked game conditions, and if true, send a notifcation with info about the game
  if (trackedGameObject.hasConditions == true) {
    //only check conditions if they exist
    console.log("game object: ");
    console.log(trackedGameObject);
    let viewOption = trackedGameObject.viewOption.toLowerCase();
    let conditionViewCount = trackedGameObject.viewCount;
    let gameName = trackedGameObject.name;

    let currentGameId = trackedGameObject.id;
    let currentGameViewCount = fullGameData.find((x) => x.id === currentGameId).views; //find a game's latest view count, using database variable

    console.log("current views: " + currentGameViewCount);

    if (viewOption == "over") {
      if (currentGameViewCount > conditionViewCount) {
        sendNotification(
          PROGRAM_NAME,
          gameName + " has met your conditions! and currently has " + currentGameViewCount + " views (click to open in browser)",
          gameName
        );
        trackedGameObject.isCooldownEnabled = true;
        enableVisualCooldown(currentGameId);
      }
    } else if (viewOption == "under") {
      if (currentGameViewCount < conditionViewCount) {
        sendNotification(
          PROGRAM_NAME,
          gameName + " has met your conditions! and currently has " + currentGameViewCount + " views (click to open in browser)",
          gameName
        );
        console.log("NAME: " + gameName);
        trackedGameObject.isCooldownEnabled = true;
        enableVisualCooldown(currentGameId);
      }
    }
  }
}

function sendNotification(title, message, args) {
  console.log("HERE:" + args);
  const myNotification = new Notification(title, {
    body: message,
  });
  // args is game Name, we use this to open a link using default browser on click (opening is handled by server)
  myNotification.onclick = () => {
    ipcRenderer.send("openLinkExternal", args);
  };
}

function enableVisualCooldown(gameId) {
  //visually gray out the game element to tell the user it's on cooldown
  let trackedElement = GetElementInsideContainer("trackedGamesList", gameId);
  trackedElement.style.color = "gray";
}

function disableVisualCooldown(gameId) {
  //return game element to default colour to tell the user it's ready and not on cooldown
  let trackedElement = GetElementInsideContainer("trackedGamesList", gameId);
  trackedElement.style.color = "black";
}

function removeTrackedGame(gameId) {
  //this deletes the game from the activeGames array and tracked list and unhides it from the search list
  let gameElement = GetElementInsideContainer("trackedGamesList", gameId);
  gameElement.remove();

  let element = GetElementInsideContainer("searchList", gameId);
  element.hidden = "";

  let index = findArrayElementByGameId(gameId, activeGames);
  activeGames.splice(index, 1);
  saveTrackedGamesToFile();
}

function maybeAskUserToUpdate() {
  if (permissionToAskUserToUpdate === true) {
    $("#askUserToUpdate").modal("show");
  }

  permissionToAskUserToUpdate = false;
}

//conditions are 2 properties, example:
//viewCount: "22"
//viewOption: "Over"

ipcRenderer.on("removeTrackedGame", (event, args) => {
  let gameId = args;
  removeTrackedGame(gameId);
});

socket.on("updateCatagories", (data) => {
  //entry point
  console.log("UPDATE RECIEVED, NEW DATA: ");

  if (shouldWeRunAddNamesFunction == true) {
    addNamesToSearchList(data);
    console.log("added names to search list");
    shouldWeRunAddNamesFunction = false;
    loadTrackedGamesFromFile();
  }

  fullGameData = data;
});

socket.on("versionCheck", (versionFromServer) => {
  if (versionFromServer > PROGRAM_VERSION) {
    maybeAskUserToUpdate();
    console.log("update");
  }
});

socket.on("connect", () => {
  let elm = document.getElementById("connecting");
  elm.className = "alert alert-success";
  elm.innerHTML = "Status: connected to server";
});

socket.on("disconnect", () => {
  let elm = document.getElementById("connecting");
  elm.className = "alert alert-danger";
  elm.innerHTML = "Status: disconnected";
});

// ipcRenderer.on('catagoryList', (event, data) => {

//   if (shouldWeRunAddNamesFunction == true)
//   {
//     addNamesToSearchList(data);
//     console.log('added names to search list');
//     shouldWeRunAddNamesFunction = false;
//   }

//   fullGameData = data;
//   console.log(fullGameData);
// })

ipcRenderer.on("newConditionSettings", (event, args) => {
  //gets new applied conditions from a game settings window
  console.log("now in clientJS mainWindow... ");
  console.log("testing new conditions... ");
  args.cooldownValueFromUser = args.cooldownValueFromUser * 60 * 1000; //convert minutes to ms
  console.log("converted value in ms: " + args.cooldownValueFromUser);
  console.log(args);
  addConditionSettings(args);
});

ipcRenderer.on("trySaveBeforeExitComplete", (event, args) => {
  saveTrackedGamesToFile();
  setTimeout(() => {
    ipcRenderer.send("exitApp");
  }, 100);
});

setInterval(() => {
  for (let i = 0; i < activeGames.length; ++i) {
    if (activeGames[i].isCooldownEnabled == false) {
      doConditionCheck(activeGames[i]);
    }
  }
}, 5000); //check conditions every X ms

function saveTrackedGamesToFile() {
  console.log("saving to file... ");

  if (shouldWeRunAddNamesFunction == false) {
    //we do this to prevent a save before a load, which would overwrite saved settings with nothing - an empty array.
    // The variable is turned false after loading the settings, and finishing the socket connection + loading the searchlist Names.
    store.set("trackedGames", activeGames);
  }

  console.log("Saving Done. Array saved >>> : ");
  console.log(activeGames);
}

function loadTrackedGamesFromFile() {
  let array = store.get("trackedGames", []);
  console.log("here: ");
  console.log(array);

  if (array.length > 0) {
    activeGames = array;

    for (let i = 0; i < activeGames.length; ++i) {
      activeGames[i].disableVisualCooldown = async function () {
        //add disableVisualCooldown function to games added from file.
        if (this.isCooldownEnabled == false) {
          disableVisualCooldown(this.id);
        }
      };

      let gameName = activeGames[i].name;
      let gameId = activeGames[i].id;

      let element = GetElementInsideContainer("searchList", gameId);
      element.hidden = "hidden";

      let trackedGamesList = document.getElementById("trackedGamesList");

      var li = document.createElement("li");
      li.textContent = gameName;
      li.id = gameId;
      trackedGamesList.appendChild(li);

      const svgIcon = `<ion-icon id='${gameId}' name="settings-outline" onclick="trackedGameConditions(this)"></ion-icon>`;
      svgIcon.id = gameId;

      let trackedGameElement = document.getElementById(gameId);
      trackedGameElement.innerHTML += svgIcon;

      if (activeGames[i].isCooldownEnabled == true) {
        //if it's on cooldown, enable visual cooldown
        enableVisualCooldown(gameId);
      }
    }
  }
}

function intervalCooldownCheck() {
  //handles cooldown ticking (timer) on a global scope, for all games.
  setInterval(() => {
    for (let i = 0; i < activeGames.length; ++i) {
      if (activeGames[i].isCooldownEnabled == true) {
        activeGames[i].cooldownCounter += 1000; //1 second
        console.log(activeGames[i].name + " = " + activeGames[i].cooldownCounter);

        if (activeGames[i].cooldownCounter >= activeGames[i].cooldownValue) {
          activeGames[i].isCooldownEnabled = false;
          activeGames[i].cooldownCounter = 0;
          activeGames[i].disableVisualCooldown();
          console.log("true");
        }
      }
    }
  }, 1000);
}

setTimeout(() => {
  intervalCooldownCheck(); //starts globally counting all cooldowns each 1 second (this takes care of all cooldown counters)
}, 1000);

setInterval(() => {
  saveTrackedGamesToFile();
  console.log("saved");
}, saveInterval);

function resetTrackedGamesFile() {
  //used by onkey button
  activeGames.forEach((game) => {
    //add games back to search list if deleted from tracked list
    //ps: this took longer than fucking needed to implement because of how fucked everything is
    let gameID = game.id;
    let elm = document.getElementsByClassName(gameID + "SS")[0];
    elm.hidden = "";
    console.log("unhide for: " + gameID + " done");
  });

  activeGames = [];
  store.set("trackedGames", activeGames);
  console.log("RESET DONE");
  $(trackedGamesList).empty();
  // to refresh the list, so you don't need to restart application to see the changes
}
