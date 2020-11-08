const { ipcRenderer } = require('electron')
let shouldWeFinishApplyButton = false;
let gameId = '';




function applyTrackedGameSettings()
{
    let chosenViewOption = document.getElementById('viewOptions').value
    let numberOfViews = document.getElementById('viewCount').value;
    console.log(numberOfViews);
    if (isNaN(numberOfViews) || numberOfViews == '')
    {
        shouldWeFinishApplyButton = false;
        resetSettingsVisuallyOnly();
        incorrectValueInputError();
    }
    else{
        shouldWeFinishApplyButton = true;
    }


    if (shouldWeFinishApplyButton == true)
    {
        let trackedConditions = {
            viewCount: numberOfViews,
            viewOption: chosenViewOption,
            gameId: gameId,
        }

        
        ipcRenderer.send('trackedGameConditionSettings', trackedConditions)
        ipcRenderer.send('closeTrackedGameSettingsWindow')

    }
    
   
    
}

function resetSettingsVisuallyOnly()
{
    document.getElementById('viewCount').value = "";
}

function incorrectValueInputError()
{
    let showError = document.getElementById('onlyNumbersAllowed');
    showError.removeAttribute('hidden', 'hidden');

    setTimeout(() => {
        showError.setAttribute('hidden', 'hidden');
    }, 1500);
}

function removeGameFromTrackedList() //being used by onKey button
{
    ipcRenderer.send('requestToRemoveTrackedGame', gameId)
    ipcRenderer.send('closeTrackedGameSettingsWindow')
}


ipcRenderer.on('sendId', (event, data) => 
{
    gameId = data;
})





