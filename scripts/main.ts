console.clear();

const gridContainer = document.getElementById("container");
let homepage: HTMLDivElement;
const logo = document.createElement("img");
    logo.setAttribute("src","images/web-audio2.svg");
    logo.setAttribute("alt","crappy logo");

// let fileButton: HTMLButtonElement;

const recorder = document.createElement("div");
recorder.setAttribute("class","recorder");
let fileButton = document.createElement("button");
fileButton.textContent = "Enter File"
let playButton = document.createElement("button");
playButton.textContent = "Play";
playButton.dataset.play = "false";
let stopButton = document.createElement("button");
stopButton.textContent = "Stop";
let loopButton = document.createElement("button");
loopButton.textContent = "Loop";
let loop = false;
let distortionButton = document.createElement("button");
distortionButton.textContent = "Distortion";
let distortionOn = false;
let fileText: HTMLParagraphElement;
let audioFile = document.getElementById("audioFile");
let gainNode;
let panNode;
let distortionNode;
let reverbNode;
let delayNode;

let clips = [];
let soundClips = document.createElement("section");
let clipCount = 0;
let recordButton = document.createElement("button");
recordButton.textContent = "Record";
let stopRecord = false;
// let stopRecordButton = document.createElement("button");
// recordButton.textContent = "Stop";







GenerateHomePage();

// function DisplayClips(){
    
// }

//structure for getting user media:
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia supported.");
    navigator.mediaDevices
      .getUserMedia(
        // constraints - only audio needed for this app
        {
          audio: true,
        },
      )
  
      // Success callback
      .then((stream: MediaStream) => {





      })
  
      // Error callback
      .catch((err) => {
        console.error(`The following getUserMedia error occurred: ${err}`);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
  

function processStream(stream:MediaStream){
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];
    recordButton.onclick = () =>{
        if(stopRecord){
            mediaRecorder.stop;
            stopRecord = false;
            recordButton.style.background = "white";
            recordButton.textContent = "Record";
            recordButton.style.color = "red";
        }
        else{
            mediaRecorder.start;
            stopRecord = true;
            recordButton.style.background = "red";
            recordButton.style.color = "white";
            recordButton.textContent = "Stop";
        }
    }
    mediaRecorder.onstop = (e) =>{
        clipCount++;
        const clipName = `Clip ${clipCount}`;
        const clipContainer = document.createElement("article");
        const clipLabel = document.createElement("p");
        const audio = document.createElement("audio");
        const deleteButton = document.createElement("button");

        clipContainer.classList.add("clip");
        audio.setAttribute("controls", "");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete";
        clipLabel.textContent = clipName;

        clipContainer.appendChild(audio);
        clipContainer.appendChild(clipLabel);
        clipContainer.appendChild(deleteButton);
        soundClips.appendChild(clipContainer);

        audio.controls = true;
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;
        console.log("recorder stopped");

        // deleteButton.onclick = function (e) {
        //     e.target.closest(".clip").remove();
        // };

    }
}

function buildRecorder(){
    recorder.appendChild(recordButton);
    const clipText = document.createElement("h4");
    clipText.textContent = "Clips:";
    recorder.appendChild(clipText);
    recorder.appendChild(soundClips);
}

fileButton.onclick = () =>{
    const fileName = prompt("Enter the name of a valid audio file. (eg: test.mp3)")
    // audioFile = "audio-files/"+fileName;
    // if(audioFile)
}

let audioCtx;

let track;

let audioElement = document.querySelector("audio");

// const audioElement = document.getElementById('audioFile') as HTMLMediaElement; // Assuming you have an audio element with the id "myAudio"
// const audioCtx = new AudioContext();
// const source = audioCtx.createMediaElementSource(audioElement);

stopButton.onclick = () =>{

}

loopButton.onclick = () =>{
    if(loop){
        loop = false;
        loopButton.textContent = "Loop";
    }
    else{
        loop = true;
        loopButton.textContent = "Stop Loop";
    }
}

playButton.onclick = () =>{
    if(!audioCtx){
        init();
    }
    if(audioCtx.state === "suspended"){
        audioCtx.resume();
    }
    if(playButton.dataset.play === "false"){
        play();
        // else throw "no audioElement";
    }
    else{
        if(audioElement !== null){
            audioElement.pause();
            playButton.dataset.play = "false";
            playButton.textContent = "Play";
        }
        else throw "no audioElement";
    }
}

distortionButton.onclick =()=>{
    if(!audioCtx) init();
    if(distortionOn){
        distortionOn=false;
        distortionNode.disconnect(audioCtx.destination);
        panNode.disconnect(distortionNode);
        panNode.connect(audioCtx.destination);
    } 
    else{
        distortionOn = true;
        panNode.disconnect(audioCtx.destination);
        panNode.connect(distortionNode).connect(audioCtx.destination);
    } 
}

// handles end of track and looping functionality
if(audioElement !== null){
    audioElement.addEventListener(
        "ended",
        () => {
            if(loop) play();
            else{
                playButton.dataset.play = "false";
                playButton.textContent = "Play";
            }
        },
        false,
    );
}

function play(){
    if(audioElement !== null){
        audioElement.play();
        playButton.dataset.play = "true";
        playButton.textContent = "Pause";
    }
}

function init() {
    const AudioContext = window.AudioContext;
    audioCtx = new AudioContext();
    track = audioCtx.createMediaElementSource(audioElement);
    gainNode = audioCtx.createGain();
    panNode = new StereoPannerNode(audioCtx);
    distortionNode = audioCtx.createWaveShaper();
    distortionNode.curve = makeDistortionCurve(400);
    reverbNode = createReverb(audioCtx);

    track.connect(gainNode).connect(panNode).connect(audioCtx.destination);
    // panNode

}

function makeDistortionCurve(amount) {
    let k = typeof amount === "number" ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for (; i < n_samples; ++i) {
      x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}



function createReverb(audioCtx) {
    const delay1 = audioCtx.createDelay(1);
    const dryNode = audioCtx.createGain();
    const wetNode = audioCtx.createGain();
    const mixer = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    delay1.delayTime.value = 0.75;
    dryNode.gain.value = 1;
    wetNode.gain.value = 0;
    filter.frequency.value = 1100;
    filter.type = "highpass";
    return {
        apply() {
          wetNode.gain.setValueAtTime(0.75, audioCtx.currentTime);
        },
        discard() {
          wetNode.gain.setValueAtTime(0, audioCtx.currentTime);
        },
        isApplied() {
          return wetNode.gain.value > 0;
        },
        placeBetween(inputNode, outputNode) {
          inputNode.connect(delay1);
          delay1.connect(wetNode);
          wetNode.connect(filter);
          filter.connect(delay1);
  
          inputNode.connect(dryNode);
          dryNode.connect(mixer);
          wetNode.connect(mixer);
          mixer.connect(outputNode);
        },
      };
}

// function init() {
//     audioCtx = new AudioContext();
//     track = new MediaElementAudioSourceNode(audioCtx, {
//       mediaElement: audioElement,
//     });

//     // Create the node that controls the volume.
//     const gainNode = new GainNode(audioCtx);

//     const volumeControl = document.querySelector('[data-action="volume"]');
//     volumeControl.addEventListener(
//       "input",
//       () => {
//         gainNode.gain.value = volumeControl.value;
//       },
//       false
//     );

//     // Create the node that controls the panning
//     const panner = new StereoPannerNode(audioCtx, { pan: 0 });

//     const pannerControl = document.querySelector('[data-action="panner"]');
//     pannerControl.addEventListener(
//       "input",
//       () => {
//         panner.pan.value = pannerControl.value;
//       },
//       false
//     );



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
    // const description = document.createElement("p");
    // description.textContent = "Cunnies.lol is the best way to find cunnies online. (besides maybe almost any other weather app...) We do have a couple cool features though.  Put in your optimal conditions, share your location, and see recomendations for climbing areas near you with the best conditions."
    let masterDiv = document.createElement("div");
    masterDiv.setAttribute("class","master");
    let distortionDiv = document.createElement("div");
    distortionDiv.setAttribute("class","distortion");
    let masterText = document.createElement("h3");
    masterText.textContent = "Master";
    masterDiv.appendChild(masterText);
    let distortionText = document.createElement("h3");
    distortionText.textContent = "Distortion";
    distortionDiv.appendChild(distortionText);
    fileText = document.createElement("p");
    fileText.textContent = "No file selected."
    homepage.appendChild(fileText);
    // fileButton = document.createElement("button");
    // fileButton.textContent = "Enter File"
    homepage.appendChild(fileButton);
    masterDiv.appendChild(playButton);
    // homepage.appendChild(stopButton);
    masterDiv.appendChild(loopButton);
    distortionDiv.appendChild(distortionButton);
    const volText = document.createElement("h4");
    volText.textContent = "Volume";
    const volFader = document.createElement("input");
    volFader.type = "range";
    volFader.id = "volume";
    volFader.step = "0.01";
    volFader.value = "1";
    volFader.min = "0";
    volFader.max = "2";
    masterDiv.appendChild(volText);
    masterDiv.appendChild(volFader);
    const panText = document.createElement("h4");
    panText.textContent = "Pan";
    const panFader = document.createElement("input");
    panFader.type = "range";
    panFader.id = "pan";
    panFader.step = "0.01";
    panFader.value = "0";
    panFader.min = "-1";
    panFader.max = "1";
    masterDiv.appendChild(panText);
    masterDiv.appendChild(panFader);
    // homepage.appendChild(masterDiv);

    volFader.addEventListener("input",()=>{
        gainNode.gain.value = volFader.value;
    },false);
    panFader.addEventListener("input",()=>{
        panNode.pan.value = panFader.value;
    },false);
    

    
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
    if(gridContainer !== null){
        gridContainer.appendChild(homepage);
        gridContainer.appendChild(masterDiv);
        gridContainer.appendChild(distortionDiv);
    }
  }