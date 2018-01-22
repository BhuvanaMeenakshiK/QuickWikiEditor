let valueFromPopUp;
let currentTabID;
let currentTabURL;
let selectText;
let changedText;


var supportedDomain = ["wikipedia.org"];

// First step is very are creating the contextMenu  item.

browser.contextMenus.create({
  id: "context_id_quickwikieditor",
  title: "QuickwikiEditor",
  contexts: ["selection"]
});


// We are listening to the ContextMenu item click
browser.contextMenus.onClicked.addListener(contextMenuAction);


// We are handling the Context Menu Click here
function contextMenuAction(info, tab){

	/*
		in info object we will be getting the id of the contextMenu and also the Selection Text.
	*/
        if(info != null && info.hasOwnProperty('menuItemId')
                        && info.hasOwnProperty('selectionText')){

        currentTabID = tab.id;
        currentTabURL = tab.url;
        checkWebsite(info['selectionText']);
        }

}


function checkWebsite(selectedText){

        selectText = selectedText;
        var showWindowPrompt = "window.prompt('How would you like to change the following word','"+ selectedText+"')";
        var executing = browser.tabs.executeScript({
                code: showWindowPrompt
              });
     
              executing.then(onExecuted, onError);
              
}


function onExecuted(result) {
        
        if(result != null && result.length ==1 && result[0] != null){
                changedText = result[0];
	if(changedText == selectText){
                showSameWordsPrompt();
	} else {
                var domainIndex = getDomainIndex(currentTabURL);
                if(domainIndex == -1){
                        showUnSupportedDomain();
                }else{
                        // Same full URL https://en.wikipedia.org/wiki/User:Iamvp7

                        // output of domainNameWithoutProto will be like 
                        //wikipedia.org/wiki/Domain_name#Domain_name_space
                        
                        var domainNameWithoutProto = currentTabURL.substring(domainIndex); 

                        //output of fileName is  Domain_name
                        var fileName = getFileName(domainNameWithoutProto);

                        //output of domainNameAlone is wikipedia.org
                        var domainNameAlone = domainNameWithoutProto.substring(0,domainNameWithoutProto.indexOf(fileName)-6);

                        // output of lang is en
                        var lang = currentTabURL.replace(new RegExp(".*[./]([a-zA-Z]*)\."+domainNameAlone+"/.*"), '$1');
                        
                        var domainWithProto = currentTabURL.substring(0,currentTabURL.indexOf('/wiki/'));

                        startChanging(domainWithProto,fileName)
                }
	}	

        } 
      }
      
      function onError(error) {
        console.log(`Error: ${error}`);
      }

function showUnSupportedDomain(){
        showAlert('Domain Not supported for changing');
}

function showSameWordsPrompt(){
        showAlert('The Changed word and Selected Word is equal');

}

function showAlert(messageToShow){
        var showEqualValPromp = "window.alert('"+messageToShow+"')";
        var executing = browser.tabs.executeScript({
                code: showEqualValPromp
              });
     
              executing.then(executedSuccess, onError);
}

function executedSuccess(result){

}



function startChanging( domainWithProto,title){
        httpGet(domainWithProto+'/w/api.php?format=json&action=query&titles='+title+'&prop=revisions&rvprop=content&redirects');
}


function httpGet(urlToCall){
        var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {

                        if (this.readyState == 4 && this.status == 200) {
                                parsegetDataResponse(this.responseText);
                        }
                };
                xhttp.open("GET", urlToCall, true);
                xhttp.send();
}



function parsegetDataResponse(responseText){
       var responseAsJSON= JSON.parse(responseText);

       if(responseAsJSON !== undefined && responseAsJSON.hasOwnProperty('query') 
                && responseAsJSON.query !== undefined && responseAsJSON.query.hasOwnProperty('pages') ){
                        var pagesArray = responseAsJSON.query.pages;
                        console.log(pagesArray);
                }
}



function getFileName(nameToParse){
        var indexofFileStart = nameToParse.indexOf('/wiki/');

        //  /wiki/ is of length 6
        var partialName = nameToParse.substring(indexofFileStart+6);
        var indexOfHash = partialName.indexOf('#');

        /*
                in some cases like https://en.wikipedia.org/wiki/Domain_name#Domain_name_space
                we have to remove #Domain_name_space  to get the file Name
        */

        if(indexOfHash == -1){
                return partialName;
        } else{
                return partialName.substring(0,indexOfHash);
        }

}

function getDomainIndex(urlToParse){
        for(var domainName in supportedDomain){
                if(urlToParse.indexOf(supportedDomain[domainName]) != -1){
                        return urlToParse.indexOf(supportedDomain[domainName]);
                }
        }

        return -1;
}