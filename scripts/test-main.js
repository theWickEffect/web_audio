const gridContainer = document.getElementById("container");
let homepage;
const logo = document.createElement("img");
    logo.setAttribute("src","images/web-audio2.svg");
    logo.setAttribute("alt","crappy logo");

let fileButton;
let playButton;
let fileText = document.createElement("p");


GenerateHomePage();


function GenerateHomePage(){
    homepage = document.createElement("div");
    homepage.setAttribute("id","home");
    homepage.setAttribute("class","home");
    // title.style.fontSize = "90px";
    // subtitle.style.fontSize = "40px";
    // const title = document.createElement("h1");
    // title.textContent = "Cunnies"
    // homepage.appendChild(title);
    // const subtitle = document.createElement("h2");
    // subtitle.textContent = "-weather for climbers-";
    // homepage.appendChild(subtitle);
    // const logo = document.createElement("img");
    // logo.setAttribute("src","images/web_audio.svg");
    // logo.setAttribute("alt","crappy logo");
    homepage.appendChild(logo);
    const description = document.createElement("p");
    description.textContent = "Cunnies.lol is the best way to find cunnies online. (besides maybe almost any other weather app...) We do have a couple cool features though.  Put in your optimal conditions, share your location, and see recomendations for climbing areas near you with the best conditions."
    fileText.textContent = "No file selected."
    homepage.appendChild(fileText);
    fileButton = document.createElement("button");
    fileButton.textContent = ("Enter File Name");
    homepage.appendChild(fileButton);
    playButton = document.createElement("button");
    fileButton.textContent = ("Play");
    homepage.appendChild(playButton);
    // homepage.appendChild(description);
    // locText = document.createElement("p");
    // locText.textContent = "Location: Default (Seattle-ish)";
    // homepage.appendChild(locText);
    // curLocButton = document.createElement("button");
    // curLocButton.textContent = "Use Current Location"
    // homepage.appendChild(curLocButton);
    // updateLocButton = document.createElement("button");
    // updateLocButton.textContent = "Set Custom Location"
    // homepage.appendChild(updateLocButton);
    // rangeText = document.createElement("p");
    // rangeText.textContent = `Max travel distance: ${range} miles`;
    // homepage.appendChild(rangeText);
    // rangeButton = document.createElement("button");
    // rangeButton.textContent = "Change Travel Distance";
    // homepage.appendChild(rangeButton);
    // homepage.appendChild(space);
    // homepage.appendChild(localCunniesButton);
    if(gridContainer !== null)gridContainer.appendChild(homepage);
    console.log("gridContainer === null: "+ gridContainer === null);
  }