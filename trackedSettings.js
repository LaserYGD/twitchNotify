const { ipcRenderer } = require("electron");
let shouldWeFinishApplyButton = false;
let gameId = "";

function applyTrackedGameSettings() {
  let chosenViewOption = document.getElementById("viewOptions").value;
  let numberOfViews = document.getElementById("viewCount").value;
  let cooldownValueFromUser = document.getElementById("cooldownSetting").value;

  numberOfViews = Math.ceil(numberOfViews);
  cooldownValueFromUser = Math.ceil(cooldownValueFromUser);

  let checkInput = isInputCorrect(numberOfViews, cooldownValueFromUser);

  if (checkInput.status == false) {
    console.log(checkInput);
    document.getElementById("onlyNumbersAllowed").innerHTML = checkInput.error;
    incorrectValueInputError();
    shouldWeFinishApplyButton = false;
  } else {
    shouldWeFinishApplyButton = true;
  }

  if (shouldWeFinishApplyButton == true) {
    let trackedConditions = {
      viewCount: numberOfViews,
      viewOption: chosenViewOption,
      gameId: gameId,
      cooldownValueFromUser: cooldownValueFromUser,
    };

    ipcRenderer.send("trackedGameConditionSettings", trackedConditions);
    ipcRenderer.send("closeTrackedGameSettingsWindow");
  }
}

function isInputCorrect(viewCount, cooldownValue) {
  if (viewCount > 2000000000 || cooldownValue > 2000000000) {
    return {
      status: false,
      error: "input is too large <br>",
    };
  } else if (isNaN(viewCount)) {
    return {
      status: false,
      error: "Views: wrong input type <br>",
    };
  } else if (viewCount == "") {
    return {
      status: false,
      error: "Views: input can't be empty <br>",
    };
  } else if (isNaN(cooldownValue) == true) {
    return {
      status: false,
      error: "Cooldown: wrong input type <br>",
    };
  } else if (viewCount < 0 || cooldownValue < 0) {
    return {
      status: false,
      error: "Negative numbers are not allowed <br>",
    };
  }

  return true;
}

function resetSettingsVisuallyOnly() {
  document.getElementById("viewCount").value = "";
}

function incorrectValueInputError() {
  let showError = document.getElementById("onlyNumbersAllowed");
  showError.removeAttribute("hidden", "hidden");

  setTimeout(() => {
    showError.setAttribute("hidden", "hidden");
  }, 1500);
}

function removeGameFromTrackedList() {
  //being used by onKey button
  ipcRenderer.send("requestToRemoveTrackedGame", gameId);
  ipcRenderer.send("closeTrackedGameSettingsWindow");
}

ipcRenderer.on("sendId", (event, data) => {
  gameId = data;
});
