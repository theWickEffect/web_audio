console.clear();

interface AppView{
    gridContainer: HTMLElement

}
const view:AppView = {
    gridContainer: document.getElementById("container")!
}

interface AppModel{
    revLoc: number;
}

const model:AppModel ={
    revLoc: -1
}



let homepage: HTMLDivElement;
const logo = document.createElement("img");
    logo.setAttribute("src","images/web-audio2.svg");
    logo.setAttribute("alt","crappy logo");

// let fileButton: HTMLButtonElement;
let reverseOn = false;
const reverseButton = document.createElement("button");
reverseButton.textContent = "Reverse";
const recorder = document.createElement("div");
recorder.setAttribute("class","recorder");
let fileButton = document.createElement("button");
fileButton.textContent = "Dist Curve"
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

let urlArr:string[] = [];
let isRev = false;
let clips:HTMLAudioElement[] = [];
let revArr:HTMLAudioElement[] = [];
let soundClips = document.createElement("section");
let clipCount = 0;
let recordButton = document.createElement("button");
recordButton.textContent = "Record";
let stopRecord = false;
// let stopRecordButton = document.createElement("button");
// recordButton.textContent = "Stop";

let audioCtx;

let track;

let audioElement = document.querySelector("audio");





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
      .then(processStream)
  
      // Error callback
      .catch((err) => {
        console.error(`The following getUserMedia error occurred: ${err}`);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
  

function processStream(stream:MediaStream){
    const mediaRecorder = new MediaRecorder(stream);
    let chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
        console.log("collecting data");
      };
    recordButton.onclick = () =>{
        if(stopRecord){
            mediaRecorder.stop();
            // stopRecordFunc();
            stopRecord = false;
            recordButton.style.background = "white";
            recordButton.textContent = "Record";
            recordButton.style.color = "red";
        }
        else{
            mediaRecorder.start();
            console.log("recorder started");
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
        const revAudio = document.createElement("audio");
        const selectButton = document.createElement("button");
        // const deleteButton = document.createElement("button");

        clipContainer.classList.add("clip");
        audio.setAttribute("controls", "");
        selectButton.textContent = "Select Track";
        // deleteButton.textContent = "Delete";
        // deleteButton.className = "delete";
        clipLabel.textContent = clipName;

        clipContainer.appendChild(audio);
        clipContainer.appendChild(clipLabel);
        clipContainer.appendChild(selectButton);
        // clipContainer.appendChild(deleteButton);
        soundClips.appendChild(clipContainer);

        audio.controls = true;
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        // chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;
        console.log("recorder stopped");

        clips.push(audio);
        urlArr.push(audioURL);

        // deleteButton.onclick = function (e) {
        //     e.target.closest(".clip").remove();
        // };
        let selectOK = true;
        const chunksLoc = clipCount-1;
        let revChunks:BlobPart[] = [];
        while(chunks.length>0) revChunks.push(chunks.pop()!);
        const blobRev = new Blob(revChunks, { type: mediaRecorder.mimeType });
        chunks = [];
        const revAudioURL = window.URL.createObjectURL(blobRev);
        revAudio.src = revAudioURL;
        console.log("rev added");

        clips.push(audio);
        revArr.push(revAudio);
        selectButton.onclick = () =>{
            model.revLoc = clipCount-1;
            if(selectOK){
                selectOK = false;
                audioElement = revAudio;
                selectButton.textContent = "Deselect Track"
            }
            else{
                selectOK = true;
                audioElement = document.querySelector("audio");
                selectButton.textContent = "Select Track"
            }
            mainControll();
        }
    }
}

function buildRecorder(){
    recorder.appendChild(recordButton);
    const clipText = document.createElement("h4");
    clipText.textContent = "Clips:";
    recorder.appendChild(clipText);
    recorder.appendChild(soundClips);
}


// stopButton.onclick = () =>{

// }

mainControll();



function mainControll(){

    init();

    reverseButton.onclick = async() => {
        
        const aBuff = await rev();
        audioElement = await bufferToAudioElement(aBuff);
        async function bufferToAudioElement(audioBuffer: AudioBuffer): Promise<HTMLAudioElement> {
            // Step 1: Create an AudioContext
            const audioContext = new AudioContext();
        
            // Step 2: Decode the audio buffer
            const audioBufferSource = audioContext.createBufferSource();
            audioBufferSource.buffer = audioBuffer;
        
            // Step 3: Create an HTML audio element
            const audioElement = new Audio();
        
            // Step 4: Set the source of the audio element
            const mediaSourceNode = audioContext.createMediaElementSource(audioElement);
            mediaSourceNode.connect(audioContext.destination);
            
            // Set the buffer source to start playing
            audioBufferSource.connect(audioContext.destination);
            audioBufferSource.start();
        
            // Wait for the decoding to complete before resolving the promise
            await new Promise<void>((resolve, reject) => {
                audioBufferSource.onended = () => resolve();
            });
        
            return audioElement;
        }
        
        
        init();
    }

    //takes a url to an audio file and returns a promise to an AudioBuffer;
    function rev(): Promise<AudioBuffer>{
        const ctx = new AudioContext;
        return fetch(urlArr[model.revLoc])
            .then(data => data.arrayBuffer())
            .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
            .then(revAudioBuffer=> reverseBuff(revAudioBuffer));
    }

    function reverseBuff(Buff:AudioBuffer):AudioBuffer{
        const numOfChannels = Buff.numberOfChannels;
        for(let channelNumber = 0;channelNumber<numOfChannels;channelNumber++){
            let startArr:Float32Array = new Float32Array;
            Buff.copyFromChannel(startArr,channelNumber);
            let revArr = new Float32Array;
            for(let i=0;i<startArr.length;i++){
                revArr[i]=startArr[startArr.length-1-i]
            }
            Buff.copyToChannel(revArr,channelNumber);
        }
        console.log("reversed the buff");
        return Buff;
    }


    let distAmt = 400

    //file button now allows user to set the amount of distortion
    //this functionality should be moved to a fader in the fx div
    fileButton.onclick = () =>{
        let dcInt = 0;
        const dc = prompt("enter dist curve");
        if(dc!== null) dcInt = parseInt(dc);
        distAmt = dcInt;
        distortionNode.curve = makeDistortionCurve(dcInt);

        // const fileName = prompt("Enter the name of a valid audio file. (eg: test.mp3)")
        // audioFile = "audio-files/"+fileName;
        // if(audioFile)
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
        let AudioContext = window.AudioContext;
        if(audioCtx) audioCtx.close();
        audioCtx = new AudioContext();
        track = audioCtx.createMediaElementSource(audioElement);
        gainNode = audioCtx.createGain();
        panNode = new StereoPannerNode(audioCtx);
        distortionNode = audioCtx.createWaveShaper();
        distortionNode.curve = makeDistortionCurve(distAmt);
        // reverb not working:
        // reverbNode = createReverb(audioCtx);

        //sets up initial audio graph
        track.connect(gainNode).connect(panNode).connect(audioCtx.destination);

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


// reverb not working
    // function createReverb(audioCtx) {
    //     const delay1 = audioCtx.createDelay(1);
    //     const dryNode = audioCtx.createGain();
    //     const wetNode = audioCtx.createGain();
    //     const mixer = audioCtx.createGain();
    //     const filter = audioCtx.createBiquadFilter();

    //     delay1.delayTime.value = 0.75;
    //     dryNode.gain.value = 1;
    //     wetNode.gain.value = 0;
    //     filter.frequency.value = 1100;
    //     filter.type = "highpass";
    //     return {
    //         apply() {
    //         wetNode.gain.setValueAtTime(0.75, audioCtx.currentTime);
    //         },
    //         discard() {
    //         wetNode.gain.setValueAtTime(0, audioCtx.currentTime);
    //         },
    //         isApplied() {
    //         return wetNode.gain.value > 0;
    //         },
    //         placeBetween(inputNode, outputNode) {
    //         inputNode.connect(delay1);
    //         delay1.connect(wetNode);
    //         wetNode.connect(filter);
    //         filter.connect(delay1);
    
    //         inputNode.connect(dryNode);
    //         dryNode.connect(mixer);
    //         wetNode.connect(mixer);
    //         mixer.connect(outputNode);
    //         },
    //     };
    // }

    
}


function GenerateHomePage(){
    homepage = document.createElement("div");
    homepage.setAttribute("id","home");
    homepage.setAttribute("class","home");

    buildRecorder();
    
    homepage.appendChild(logo);
    let masterDiv = document.createElement("div");
    masterDiv.setAttribute("class","master");
    let distortionDiv = document.createElement("div");
    distortionDiv.setAttribute("class","distortion");
    let masterText = document.createElement("h3");
    masterText.textContent = "Master";
    masterDiv.appendChild(masterText);
    let distortionText = document.createElement("h3");
    distortionText.textContent = "FX";
    distortionDiv.appendChild(distortionText);
    fileText = document.createElement("p");
    fileText.textContent = "No file selected."
    homepage.appendChild(fileText);
    homepage.appendChild(fileButton);
    masterDiv.appendChild(playButton);
    // homepage.appendChild(stopButton);
    masterDiv.appendChild(loopButton);
    distortionDiv.appendChild(distortionButton);
    distortionDiv.appendChild(reverseButton);
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

    volFader.addEventListener("input",()=>{
        gainNode.gain.value = volFader.value;
    },false);
    panFader.addEventListener("input",()=>{
        panNode.pan.value = panFader.value;
    },false);

    if(view.gridContainer !== null){
        view.gridContainer.appendChild(homepage);
        view.gridContainer.appendChild(masterDiv);
        view.gridContainer.appendChild(distortionDiv);
        view.gridContainer.appendChild(recorder)
    }
  }