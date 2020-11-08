const { ipcRenderer, ipcMain } = require('electron')
const Store  = require('electron-store')
const store = new Store();



let activeGames = [];
let fullGameData = [];
let shouldWeRunAddNamesFunction = true;
const PROGRAM_NAME = 'twitchNotify';

function addNamesToSearchList(data)
{
  let searchList = document.getElementById('searchList');

  for (var i = 0; i < data.length; i++) {
    // Create DOM element
    var li = document.createElement('li');

    li.addEventListener("click", getNameOnClick, false);
        
    // Set text of element
    li.textContent = data[i].name;
    li.name = data[i].name;
    li.id = data[i].id;
    li.views = data[i].views;

    // Append this element to its parent
    searchList.appendChild(li);
    hideOrUnhideAttribute('hide', 'searchList');

  }

  unblockSearchInput(); //once searchList is loaded, then unblock input

}

function runMe()
{
    let element = document.getElementById('connecting');
    element.remove();
    let al = "alert";
    let parentElement = document.getElementById('currentStatus');
    var div = document.createElement("div");
    div.className = "alert alert-primary";
    div.role = "alert";
    div.innerHTML = "updated!";


    parentElement.appendChild(div)
    
}

function openOptions() //it is being used from a button onkey event
{
    ipcRenderer.send('openOptions')
}

function searchFilter() { // it is being used
  // Declare variables
  var input, searchInput, ul, li, i, txtValue;
  var lis = document.getElementById("searchList").getElementsByTagName("li");
  

  
  input = document.getElementById('searchInput');
  //searchInput variable is the one containing the text inside of search
  searchInput = input.value.toUpperCase();
  ul = document.getElementById("searchList");
  li = ul.getElementsByTagName('li');
  //console.log(searchInput);
  

  // Loop through all list items, and hide those who don't match the search query
  if (searchInput.length > 0)
  {
    hideOrUnhideAttribute('unhide', 'searchList');
    for (i = 0; i < lis.length; i++) {
      txtValue = lis[i].innerHTML;
      if (txtValue.toUpperCase().indexOf(searchInput) > -1) {
        li[i].style.display = "";
      } else {
        li[i].style.display = "none";
      }
    }

  }
  else
  {
    hideOrUnhideAttribute('hide', 'searchList');
  }


}

function getNameOnClick() //gets triggered by onclick in the search list, upon being clicked this function will add the game to the TrackedList
{
  let gameName = this.name
  let gameId = this.id;

  activeGames.push({
    name: gameName,
    id: gameId,
    isCooldownEnabled: false,
    cooldownCounter: 0,
    cooldownValue: 10000,
    // startCooldown: async function() { //this starts the cooldown countdown, uses the "cooldown" value the amount of time to wait for
    //   startInterval = setInterval(() => {
    //     this.cooldownCounter -= 1000;
    //     console.log(this.name + ': ' + this.cooldownCounter);

    //     if (this.cooldownCounter <= 0)
    //     {
    //       this.cooldownCounter = 0; 
    //       this.isCooldownEnabled = false;
    //       this.disableVisualCooldown();
    //       console.log(clearInterval(startInterval));

    //     }
    //   }, 1000);
    // },
    disableVisualCooldown: function() {
      if (this.isCooldownEnabled == false)
      {
        disableVisualCooldown(this.id);
      }
    },
    // startCooldownTimer: function() {
    //   setTimeout(() => {
    //     this.isCooldownEnabled = false;
    //     disableVisualCooldown(this.id);
    //     console.log('Cooldown Disabled! ');
    //   }, 15000); //cooldown delay in ms, the value here is the default value 3600000
    // }
  })

  // saveTrackedGamesToFile();
  

  let element = document.getElementById(gameId);
  hideOrUnhideAttribute('hide', gameId)

  let trackedGamesList = document.getElementById('trackedGamesList');

  var li = document.createElement('li');
  li.textContent = gameName;
  li.id = gameId;
  trackedGamesList.appendChild(li);

  const svgIcon = `<ion-icon id='${gameId}' name="settings-outline" onclick="trackedGameConditions(this)"></ion-icon>`;
  svgIcon.id = gameId;
 
  let trackedGameElement = document.getElementById(gameId)
  trackedGameElement.innerHTML += svgIcon;

  saveTrackedGamesToFile();

}

function unblockSearchInput() //we run this once we successfully connect to the database and load search names 
{
  document.getElementById("searchInput").disabled = false;
}

function hideOrUnhideAttribute(commandInString, idName) //'hide' to hide, 'unhide' to unhide. Crazy i know. 
{
  let htmlElement = document.getElementById(`${idName}`);
  let command = commandInString.toLowerCase();

  if (command === 'hide')
  {
    htmlElement.hidden = 'hidden';
  }
  else if (command === 'unhide')
  {
    htmlElement.hidden = '';
  }

}

function GetElementInsideContainer(containerID, childID) {
  var elm = document.getElementById(childID);
  var parent = elm ? elm.parentNode : {};
  return (parent.id && parent.id === containerID) ? elm : {};
}

function findArrayElementByGameId(gameId, array) //get index of array element using gameid
{
  console.log(array);
  for (let i = 0; i < array.length; ++i)
  {
    if (array[i].id == gameId)
    {
      return i;
    }
  }
}


function trackedGameConditions(state) //being used by OnKey 
{
  console.log(activeGames);
  openTrackedSettingsWindow(state.id);

  //let test = activeGames.find(x => x.id === state.id).viewChoice = 'over';
 
}

function openTrackedSettingsWindow(id) //it is being used from a button onkey event
{
    ipcRenderer.send('openTrackedSettings', id)
}

function addConditionSettings(gameData) //adds conditions to a game, requires the game's ID to find it
{
  activeGames.find(x => x.id === gameData.gameId).viewOption = gameData.viewOption;
  activeGames.find(x => x.id === gameData.gameId).viewCount = gameData.viewCount;
  activeGames.find(x => x.id === gameData.gameId).hasConditions = true;

}

function doConditionCheck(trackedGameObject) //check tracked game conditions, and if true, send a notifcation with info about the game
{

  if (trackedGameObject.hasConditions == true) //only check conditions if they exist
  {
    
    console.log('game object: ');
    console.log(trackedGameObject);
    let viewOption = trackedGameObject.viewOption.toLowerCase();
    let conditionViewCount = trackedGameObject.viewCount;
    let gameName = trackedGameObject.name;

    let currentGameId = trackedGameObject.id;
    let currentGameViewCount = fullGameData.find(x => x.id === currentGameId).views; //find a game's latest view count, using database variable

    console.log('current views: ' + currentGameViewCount);
  
    if (viewOption == 'over')
    {
      if (currentGameViewCount > conditionViewCount)
      {
        sendNotification(PROGRAM_NAME, gameName + ' has met your conditions! and currently has ' + currentGameViewCount + ' views' );
        trackedGameObject.isCooldownEnabled = true;
        enableVisualCooldown(currentGameId);
      }
    }
    else if (viewOption == 'under')
    {
      if (currentGameViewCount < conditionViewCount)
      {
        sendNotification(PROGRAM_NAME, gameName + ' has met your conditions! and currently has ' + currentGameViewCount + ' views' );
        trackedGameObject.isCooldownEnabled = true;
        enableVisualCooldown(currentGameId);
      }
    }

  }
  
}

function sendNotification(title, message)
{
  const myNotification = new Notification(title, {
    body: message
  })
} 

function enableVisualCooldown(gameId) //visually gray out the game element to tell the user it's on cooldown
{
  let trackedElement = GetElementInsideContainer('trackedGamesList', gameId)
  trackedElement.style.color = 'gray';
}

function disableVisualCooldown(gameId) //return game element to default colour tell the user it's ready and not on cooldown
{
  let trackedElement = GetElementInsideContainer('trackedGamesList', gameId)
  trackedElement.style.color = 'black';
}

function removeTrackedGame(gameId) //this deletes the game from the activeGames array and tracked list and unhides it from the search list
{
  let gameElement = GetElementInsideContainer('trackedGamesList', gameId)
  gameElement.remove();
  
  let element = GetElementInsideContainer('searchList', gameId);
  element.hidden = '';

  let index = findArrayElementByGameId(gameId, activeGames)
  activeGames.splice(index, 1);
  saveTrackedGamesToFile();
}

//conditions are 2 properties, example:
//viewCount: "22"
//viewOption: "Over"

ipcRenderer.on('removeTrackedGame', (event, args) => {
  let gameId = args;
  removeTrackedGame(gameId);
})


socket.on('updateCatagories', data => { //entry point
  console.log('UPDATE RECIEVED, NEW DATA: ');
  
  if (shouldWeRunAddNamesFunction == true)
  {
    addNamesToSearchList(data);
    console.log('added names to search list');
    shouldWeRunAddNamesFunction = false;
  }

  fullGameData = data;
  
  setTimeout(() => {
    loadTrackedGamesFromFile();
  }, 500);
  

})


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

ipcRenderer.on('newConditionSettings', (event, args) => { //gets new applied conditions from a game settings window
  console.log('now in clientJS mainWindow... ');
  console.log('testing new conditions... ');
  console.log(args);
  addConditionSettings(args);
})

setInterval(() => {
  for (let i = 0; i < activeGames.length; ++i)
  {
    if (activeGames[i].isCooldownEnabled == false)
    {
      doConditionCheck(activeGames[i]);
    }
  }

}, 5000); //check conditions every X ms

function saveTrackedGamesToFile()
{
  store.set('trackedGames', activeGames);
}


function loadTrackedGamesFromFile()
{
  let array = store.get('trackedGames');
  console.log('here: ');
  console.log(array);

  if (array.length > 0)
  {
    activeGames = array;

    for (let i = 0; i < activeGames.length; ++i)
    {
      activeGames[i].disableVisualCooldown = async function() { //add disableVisualCooldown function to games added from file. 
        if (this.isCooldownEnabled == false)
        {
          disableVisualCooldown(this.id);
        }
      };

    

      let gameName = activeGames[i].name
      let gameId = activeGames[i].id;

      let element = GetElementInsideContainer('searchList', gameId);
      element.hidden = 'hidden';

      let trackedGamesList = document.getElementById('trackedGamesList');

      var li = document.createElement('li');
      li.textContent = gameName;
      li.id = gameId;
      trackedGamesList.appendChild(li);

      const svgIcon = `<ion-icon id='${gameId}' name="settings-outline" onclick="trackedGameConditions(this)"></ion-icon>`;
      svgIcon.id = gameId;
 
      let trackedGameElement = document.getElementById(gameId)
      trackedGameElement.innerHTML += svgIcon;
    }

  }
}

function intervalCooldownCheck() //handles cooldown ticking (timer) on a global scope, for all games. 
{
  setInterval(() => {
    for (let i = 0; i < activeGames.length; ++i)
    {

     
      if (activeGames[i].isCooldownEnabled == true)
      {
          activeGames[i].cooldownCounter += 1000; //1 second
          console.log(activeGames[i].name + ' = ' + activeGames[i].cooldownCounter);

          if (activeGames[i].cooldownCounter >= activeGames[i].cooldownValue)
          {
            activeGames[i].isCooldownEnabled = false;
            activeGames[i].cooldownCounter = 0;
            activeGames[i].disableVisualCooldown();
            console.log('true');
          }
          
      }
    }
  }, 1000);
}

setTimeout(() => {
  intervalCooldownCheck(); //starts globally counting all cooldowns each 1 second (this takes care of all cooldown counters)
}, 1000);

function resetTrackedGamesFile() //used by onkey button
{
  activeGames = [];
  store.set('trackedGames', activeGames);
}
