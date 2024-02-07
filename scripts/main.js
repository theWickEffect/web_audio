"use strict";

import {areas} from "./build-areas-data.js"
// let cookies;
let change = false;
const debug = true;

// if(localStorage.getItem("cookies")) cookies = true;
// else{
//     cookies = confirm("This website uses cookies.");
//     if(cookies) localStorage.setItem("cookies","true");
// } 
let errorArr=[];
const maxRetries = 10;
let retries;
const refreshHours = 3;
const latMile = 1/60;
const lonMile = 1/40;
const defaultLoc = '47.60621,-122.33207';
const defaultRange = 50;
const defaultHigh = 78;
const defaultLow = 44;
const defaultPrecip = 15;
const defaultHumid = 50;
let maxTemp = defaultHigh;
let minTemp = defaultLow;
let homepage;
let cunniesPage;
let blueButton;
let cunniesText;
let sidebar;
const gridContainer = document.getElementById("container");
const homeButton = document.createElement("button");
homeButton.textContent = "Return to Main";
homeButton.style.backgroundColor = "yellowgreen";
const localCunniesButton = document.createElement("button");
localCunniesButton.textContent = "Get Cunnies";
const space = document.createElement("p");
space.textContent = " ";
const space2 = document.createElement("p");
space.textContent = " ";
const title = document.createElement("h1");
title.textContent = "Cunnies"
const subtitle = document.createElement("h2");
subtitle.textContent = "-weather for climbers-";
let buttonArr;

// function onClickMy(idx) {
//   // do whatever
// }
// myBtns.forEach((b, i) => b.onclick = () => onClickMy(i))



let range = defaultRange;
let weather1 = "";
let high1 = "";
let low1 = "";
let precip1 = "";
let humid1 = "";

let weather1p = document.getElementById("weather1");
let high1p = document.getElementById("high1");
// let low1p = document.getElementById("low1");
let precip1p = document.getElementById("precip1");
let humid1p = document.getElementById("humid1");

let userLoc = defaultLoc;
let userLat;
let userLon;
let userHigh = defaultHigh;
let userLow = defaultLow;
let userPrecip = defaultPrecip;
let userHumid = defaultHumid;
let maxLat;
let minLat;
let maxLon;
let minLon;

if(localStorage.getItem("range")){
  range = localStorage.getItem("range");
}

if(localStorage.getItem("userLoc")){
    userLoc = localStorage.getItem("userLoc");
}
updateLoc();

updateLatLonRange();

let localAreas;
let localCunnies; 
let cunniesArr;

// const localCunniesButton = document.getElementById("localCunnies");

homeButton.onclick = () =>{
  gridContainer.removeChild(sidebar);
  gridContainer.removeChild(cunniesText);
  GenerateHomePage();
}

localCunniesButton.onclick = async () => {
  console.log("ok");
  localAreas = getLocalAreas();
  console.log("localAreas Ok");
  localCunnies = await getLocalCunnies();
  console.log("localCunnies ok");
  buildCunniesArr();
  gridContainer.removeChild(homepage);
  GenerateCunniesPage();
  sidebar = document.createElement("div");
  sidebar.setAttribute("class","sidebar");
  gridContainer.appendChild(sidebar);
  buildButtonArr();
  sortByIndex(0);
  buildCunniesText(0);

  // printWeatherForLocalAreas();
  if(debug)console.log("printWeather passed");
}

// printWeatherforLocalAreas();

// fetchWeather2();
// updateWeather();

function setUserLoc(uLoc){
    uLoc = uLoc.split(" ").join("");
    userLoc = uLoc;
    localStorage.setItem("userLoc",userLoc);
    updateLoc();
}

function updateLatLonRange(){
  let latRange = range*latMile;
  let lonRange = range*lonMile;
  maxLat = userLat+latRange;
  minLat = userLat-latRange;
  maxLon = userLon+lonRange;
  minLon = userLon-lonRange;
}

function getLocalAreas(){
  let localAreas = {};
  for(const area of Object.keys(areas)){
    if(debug)console.log(area);
    const aLatLon = areas[area];
    if(debug) console.log(aLatLon);
    if(aLatLon[0]>=minLat && aLatLon[0]<=maxLat && aLatLon[1]>=minLon && aLatLon[1]<=maxLon){
      localAreas[area]=aLatLon;
    }
  }
  if(debug) console.log(localAreas);
  return localAreas;
}

async function getLocalCunnies(){
  retries = 0;
  let localCunnies = {};
  let curTime = Date.now();
  for(const area of Object.keys(localAreas)){
    let found = false;
    if(localStorage.getItem(area)){
      let areaTime = localStorage.getItem(area+"Time");
      areaTime = JSON.parse(areaTime);
      if(curTime<areaTime+(refreshHours*3600000)){
        if(localStorage.getItem(area)!=="Error"){
          localCunnies[area]=JSON.parse(localStorage.getItem(area));
          found = true;
          if(debug) console.log("Got "+area+" from local storage.")
        }
      }
    }
    if(debug) console.log("ok");
    if(!found){
      localCunnies[area]=await fetchWeather(localAreas[area][0],localAreas[area][1]);
      localStorage.setItem(area,JSON.stringify(localCunnies[area]));
      localStorage.setItem(area+"Time",JSON.stringify(curTime));
    }
  }
  return localCunnies;
}

function buildCunniesArr(){
  cunniesArr = [];
  errorArr = [];
  for(const area of Object.keys(localCunnies)){
    if(localCunnies[area]==="Error"){
      errorArr.Push(area);
    }
    else{
      const areaCunnies = {};
    const c = localCunnies[area].properties.periods;
    areaCunnies["location"] = area;
    areaCunnies["cunnies"] = c;
    cunniesArr.push(areaCunnies);
    }
  }
}

function sortByIndex(index){
  cunniesArr.sort(function(a,b){
    let weight = a.cunnies[index].probabilityOfPrecipitation.value*1000-b.cunnies[index].probabilityOfPrecipitation.value*1000;
    if(a.cunnies[index].temperature.value<=maxTemp & a.cunnies[index].temperature.value>=minTemp) weight-= 200;
    if(b.cunnies[index].temperature<=maxTemp & b.cunnies[index].temperature>=minTemp) weight+= 200;
    weight+= a.cunnies[index].relativeHumidity.value-b.cunnies[index].relativeHumidity.value;
    return weight;
  });
}

function buildButtonArr(){
  title.style.fontSize = "40px";
  sidebar.appendChild(title);
  subtitle.style.fontSize = "15px";
  sidebar.appendChild(subtitle);
  // sidebar.appendChild(space);
  buttonArr = [];
  // if(cunniesArr.length===0) return;
  for(let i = 0;i<cunniesArr[0].cunnies.length;i++){
    let nextButton = document.createElement("button");
    nextButton.setAttribute("group","buttonArr");
    nextButton.textContent = cunniesArr[0].cunnies[i].name;
    sidebar.appendChild(nextButton);
    buttonArr.push(nextButton);
    nextButton.onclick = () =>{
      sortByIndex(i);
      gridContainer.removeChild(cunniesText);
      buildCunniesText(i);
    }
  }
  // const space = document.createElement("p");
  // space.textContent = " "
  sidebar.appendChild(space);
  // homeButton = document.createElement("button");
  // homeButton.textContent = "Return to Main";
  sidebar.appendChild(homeButton);
  sidebar.appendChild(space2);
  blueButton = buttonArr[0];
}

// function printWeatherForLocalAreas(){
//   const areasWeather = document.createElement("div");
//   if(debug) console.log("ok");
//   for(const area of Object.keys(localCunnies)){
//     // let myWeather = await area; 
//     // let valArr = Promise.all([prom1, prom2]);
//     // let [val1, val2] = valArr; 
//     const areaWeather = document.createElement("div");
//     const areaName = document.createElement("h4");
//     areaName.textContent = area;
//     areaWeather.appendChild(areaName);
//     // localCunnies.area = localCunnies.area.properties.periods;
//     for(let i = 0;i<localCunnies[area].properties.periods.length; i++){
//       if(debug) console.log("ok");
//       const areaForecast = localCunnies[area].properties.periods[i];
//       const periodWeather = document.createElement("div");
//       const periodName = document.createElement("h5");
//       periodName.textContent = areaForecast.name;
//       periodWeather.appendChild(periodName);
//       const areaTemp = document.createElement("p");
//       areaTemp.textContent = areaForecast.temperature;
//       periodWeather.appendChild(areaTemp);
//       areaWeather.appendChild(periodWeather);
//     }
//     areasWeather.appendChild(areaWeather);
//   }
//   const insertLoc = document.getElementById("localCunniesGoHere");
//   gridContainer.insertBefore(areasWeather,insertLoc);
//   return areasWeather;
// }

function updateLoc(){
    // let locParagraph = document.getElementById("location");
    // locParagraph.textContent = `Location (Lat,Lon): ${userLoc}`;
    const latlonArr = userLoc.split(",");
    userLat = +latlonArr[0];
    userLon = +latlonArr[1];
}

let updateLocButton = document.getElementById("changeLoc");
let curLocButton = document.getElementById("getCurLoc");
let cunniesButton = document.getElementById("getCunnies");
let rangeButton;
let rangeText;
let locText;
const endbar = document.getElementById("endbar");

GenerateHomePage();

curLocButton.onclick = () =>{
    getUserLocation();
} 

updateLocButton.onclick = () =>{
    const l = prompt("Please enter your latitude and longitude: (eg: 47.60621,-122.33207)");
    setUserLoc(l);
}

// cunniesButton.onclick = () =>{
//     if(change) fetchWeather2();
//     updateWeather();
// }

async function fetchWeather(lat,lon){
  const apiEndpoint = `https://api.weather.gov/points/${lat},${lon}`;
  try {
    let response = await fetch(apiEndpoint);
    while(!response.ok && retries<maxRetries){
      retries++;
      response = await fetch(apiEndpoint);
      if(debug) console.log(`Retry: ${retries}`);
    }
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const endpoint2 = data.properties.forecast;
    let response2 = await fetch(endpoint2);
    while(!response2.ok && retries<maxRetries){
      retries++;
      response2 = await fetch(endpoint2);
      if(debug) console.log(`Retry: ${retries}`);
    }
    if (!response2.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const forecast = await response2.json();
    
    return forecast;

  } catch (error) {
    console.error('Error fetching data:', error);
    return "Error";
  }
}

// async function fetchWeather1() {
//     change = false;
//     // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint
//     const apiEndpoint = 'https://api.weather.gov/points/'+userLoc;
  
//     try {
//       // Make a GET request using await
//       const response = await fetch(apiEndpoint);
  
//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }
  
//       // Parse the JSON response
//       const data = await response.json();
//     //   const weatherData = JSON.parse(data);
//       const forecast = data.properties.forecast;
//        console.dir(forecast);
      
//       return forecast;
//     //   weather1 = forecast["properties"]["periods"][0]["name"];
//     //     high1 = forecast["properties"]["periods"][0]["temperature"];
//     //     low1 = forecast["properties"]["periods"][0]["name"];
//     //     precip1 = forecast["properties"]["periods"][0]["probabilityOfPrecipitation"]["value"];
//     //     humid1 = forecast["properties"]["periods"][0]["relativeHumidity"]["value"];
  
     
//     } catch (error) {
//       console.error('Error fetching data:', error);
//         weather1 = "Error Fetching Cunnies"
//         high1 = "Please make sure to enter valid Latitude and Longitude."
//     }
//   }

//   async function fetchWeather2(){
//     let endpoint2 = await fetchWeather1();
//     try {
//         // Make a GET request using await
//         const response = await fetch(endpoint2);
    
//         if (!response.ok) {
//           throw new Error(`HTTP error! Status: ${response.status}`);
//         }
    
//         // Parse the JSON response
//         const forecast = await response.json();
//         // const forecast = JSON.parse(data);`
//         weather1 = forecast.properties.periods[0].name;
//           high1 = forecast.properties.periods[0].temperature;
//           low1 = forecast.properties.periods[0].name;
//           precip1 = forecast.properties.periods[0].probabilityOfPrecipitation.value;
//           humid1 = forecast.properties.periods[0].relativeHumidity.value;
//           if(precip1===null) precip1 = 0;
//           if(humid1===null) humid1 = 0;
//         console.dir(forecast);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//           weather1 = "Error Fetching Cunnies"
//           high1 = "Please make sure to enter valid Latitude and Longitude."
//       }
//   }
 
// function updateWeather(){
//     if(weather1[0]==='E'){
//         weather1p.textContent = weather1;
//         high1p.textContent = high1;
//         precip1p.textContent = "";
//         humid1p.textContent = "";
//     }
//     else{
//         weather1p.textContent = weather1 +":";
//         high1p.textContent = "Temperature: " + high1 + " F";
//         precip1p.textContent = "Chance of Precipitation: " + precip1+"%";
//         humid1p.textContent = "Humidity: " + humid1 + "%";
//     }
// }

function getUserLocation() {
    // Check if the Geolocation API is supported by the browser
    if (navigator.geolocation) {
      // Request the user's current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success callback
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // Use the latitude and longitude as needed
            userLoc = latitude + "," + longitude;
            setUserLoc(userLoc);

          console.log("Latitude:", latitude);
          console.log("Longitude:", longitude);
        },
        (error) => {
          // Error callback
          console.error('Error getting location:', error.message);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

let climbingData;
// async function getClimbingAreas(){
//     let data = await fetch("https://www.climbingweather.com/api");
//     climbingData = await data.json();
// }
// getClimbingAreas();

function GenerateHomePage(){
  homepage = document.createElement("div");
  homepage.setAttribute("id","home");
  homepage.setAttribute("class","home");
  title.style.fontSize = "90px";
  subtitle.style.fontSize = "40px";
  // const title = document.createElement("h1");
  // title.textContent = "Cunnies"
  homepage.appendChild(title);
  // const subtitle = document.createElement("h2");
  // subtitle.textContent = "-weather for climbers-";
  homepage.appendChild(subtitle);
  const logo = document.createElement("img");
  logo.setAttribute("src","images/climbing-weather2.svg");
  logo.setAttribute("alt","crappy logo");
  homepage.appendChild(logo);
  const description = document.createElement("p");
  description.textContent = "Cunnies.lol is the best way to find cunnies online. (besides maybe almost any other weather app...) We do have a couple cool features though.  Put in your optimal conditions, share your location, and see recomendations for climbing areas near you with the best conditions."
  homepage.appendChild(description);
  locText = document.createElement("p");
  locText.textContent = "Location: Default (Seattle-ish)";
  homepage.appendChild(locText);
  curLocButton = document.createElement("button");
  curLocButton.textContent = "Use Current Location"
  homepage.appendChild(curLocButton);
  updateLocButton = document.createElement("button");
  updateLocButton.textContent = "Set Custom Location"
  homepage.appendChild(updateLocButton);
  rangeText = document.createElement("p");
  rangeText.textContent = `Max travel distance: ${range} miles`;
  homepage.appendChild(rangeText);
  rangeButton = document.createElement("button");
  rangeButton.textContent = "Change Travel Distance";
  homepage.appendChild(rangeButton);
  homepage.appendChild(space);
  homepage.appendChild(localCunniesButton);
  gridContainer.appendChild(homepage);
}
function GenerateCunniesPage(){
  // cunniesPage = document.createElement("div");
  // cunniesPage.setAttribute("class","cunnies");
  // cunniesPage.setAttribute("id","cunniesPage");
  // timeTitle = document.createElement("t3");
  // timeTitle.textContent = XXXXXXXXXXXXXXXXXXXXXX;
  // gridContainer.appendChild(cunniesPage);

  
}

function buildCunniesText(index){
  // blueButton.style.backgroundColor = "yellow";
  // blueButton.style.color = "black";
  // blueButton.addEventListener("mouseover",()=>{
  //   blueButton.style.backgroundColor = "black";
  //   blueButton.style.color = "yellow";
  // });
  // blueButton.addEventListener("mouseout",()=>{
  //   blueButton.style.backgroundColor = "yellow";
  //   blueButton.style.color = "black";
  // });
  blueButton.removeAttribute("style");
  blueButton = buttonArr[index];
  blueButton.style.backgroundColor = "blue";
  blueButton.style.color = "yellow";
  cunniesText = document.createElement("div");
  cunniesText.setAttribute("class","cunnies");
  for(let i = 0;i<cunniesArr.length;i++){
    const areaName = document.createElement("h5");
    areaName.textContent = cunniesArr[i].location;
    cunniesText.appendChild(areaName);
    const temperature = document.createElement("p");
    temperature.textContent = `Temp: ${cunniesArr[i].cunnies[index].temperature}°F`;
    cunniesText.appendChild(temperature);
    const chanceOfRain = document.createElement("p");
    let rain = cunniesArr[i].cunnies[index].probabilityOfPrecipitation.value;
    if (rain===null) rain = 0;
    chanceOfRain.textContent = `Chance of wet: ${rain}%`;
    cunniesText.appendChild(chanceOfRain);
    const humidity = document.createElement("p");
    let humid = cunniesArr[i].cunnies[index].relativeHumidity.value;
    if(humid === null) humid = 0;
    humidity.textContent = `Humidity: ${humid}%`;
    cunniesText.appendChild(humidity);
  }
  gridContainer.appendChild(cunniesText);
}
  

