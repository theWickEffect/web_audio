console.clear();

interface AppView {
  gridContainer: HTMLElement;
  reverseButton: HTMLButtonElement;
  recorder: HTMLDivElement;
  distAmtButton: HTMLButtonElement;
  playButton: HTMLButtonElement;
  loopButton: HTMLButtonElement;
  distortionButton: HTMLButtonElement;
  volFader: HTMLInputElement;
  panFader: HTMLInputElement;
  soundClips: HTMLElement;
  recordButton: HTMLButtonElement;
}

const view = createView();

function createView(): AppView {
  const reverseButton = document.createElement("button");
  reverseButton.textContent = "Reverse";
  const recorder = document.createElement("div");
  recorder.setAttribute("class", "recorder");
  let distAmtButton = document.createElement("button");
  distAmtButton.textContent = "Dist Curve";
  let playButton = document.createElement("button");
  playButton.textContent = "Play";
  playButton.dataset.play = "false";
  let loopButton = document.createElement("button");
  loopButton.textContent = "Loop";
  let distortionButton = document.createElement("button");
  distortionButton.textContent = "Distortion";
  const volFader = document.createElement("input");
  volFader.type = "range";
  volFader.id = "volume";
  volFader.step = "0.01";
  volFader.value = "1";
  volFader.min = "0";
  volFader.max = "2";
  const panFader = document.createElement("input");
  panFader.type = "range";
  panFader.id = "pan";
  panFader.step = "0.01";
  panFader.value = "0";
  panFader.min = "-1";
  panFader.max = "1";
  const recordButton = document.createElement("button");
  recordButton.textContent = "Record";

  const view: AppView = {
    gridContainer: document.getElementById("container")!,
    reverseButton,
    recorder,
    distAmtButton,
    playButton,
    loopButton,
    distortionButton,
    volFader,
    panFader,
    soundClips: document.createElement("section"),
    recordButton,
  };
  return view;
}

interface AppModel {
  revLoc: number;
  loop: boolean;
  distortionOn: boolean;
  gainNode: GainNode | null;
  panNode: StereoPannerNode | null;
  distortionNode: WaveShaperNode | null;
  audioCtx: AudioContext | null;
  audioElement: HTMLAudioElement | null;
  track: MediaElementAudioSourceNode | null;
  urlArr: string[];
  clipCount: number;
  // stopRecord: boolean;
  distAmt: number;
  // reverbNode;
  // delayNode;
  // clips:HTMLAudioElement[];
}

const model: AppModel = {
  revLoc: -1,
  loop: false,
  distortionOn: false,
  gainNode: null,
  panNode: null,
  distortionNode: null,
  audioCtx: null,
  audioElement: document.querySelector("audio"),
  track: null,
  urlArr: [],
  clipCount: 0,
  // stopRecord: false,
  distAmt: 400,
  // clips: [],
  // reverbNode: null,
  // delayNode: null,
};

GenerateHomePage();

// TODO(@darzu): fill in
interface MediaManager {
  stream: MediaStream;
  mediaRecorder: MediaRecorder;

  _chunks: BlobPart[];

  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

function assert(condition: any, msg?: string): asserts condition {
  if (!condition)
    throw new Error(msg ?? "Assertion failed (consider adding a helpful msg).");
}

async function initMedia(): Promise<MediaManager> {
  assert(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
    "getUserMedia not supported on your browser!"
  );

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const mediaRecorder = new MediaRecorder(stream);

  let chunks: BlobPart[] = []; // TODO(@darzu): move into manager

  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
    console.log("collecting data");
  };

  const manager: MediaManager = {
    stream,
    mediaRecorder,
    isRecording: false,

    _chunks: chunks,

    startRecording,
    stopRecording,
  };

  return manager;

  function startRecording() {
    manager.mediaRecorder.start();
    manager.isRecording = true;
  }
  function stopRecording() {
    manager.mediaRecorder.stop();
    manager.isRecording = false;
  }
}

const _media = await initMedia();

export const _foo = true;

initMediaView(_media);

function initMediaView(manager: MediaManager) {
  const { mediaRecorder, stream } = manager;

  console.log("process stream");

  // TODO(@darzu): seperate view changes from model changes
  view.recordButton.onclick = () => {
    if (manager.isRecording) {
      manager.stopRecording();

      view.recordButton.style.background = "white";
      view.recordButton.textContent = "Record";
      view.recordButton.style.color = "red";
    } else {
      console.log("recorder started");

      manager.startRecording();

      view.recordButton.style.background = "red";
      view.recordButton.style.color = "white";
      view.recordButton.textContent = "Stop";
    }
  };

  const chunks = manager._chunks;

  interface Clip {
    name: string;
    blob: Blob;
    url: string;

    // TODO(@darzu): REVERSE
    reverseUrl: string;
  }

  let _nextClipId = 1;
  function createClip(chunks: BlobPart[]): Clip {
    // TODO(@darzu):

    const name = `Clip ${_nextClipId}`;
    _nextClipId += 1;

    const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
    // chunks = [];
    const url = window.URL.createObjectURL(blob);

    // TODO(@darzu): HACK. remove urlArr ??
    model.urlArr.push(url);

    // TODO(@darzu): REVERSE hack stuff!
    let revChunks: BlobPart[] = [];
    while (chunks.length > 0) revChunks.push(chunks.pop()!);
    const blobRev = new Blob(revChunks, { type: mediaRecorder.mimeType });
    const reverseUrl = window.URL.createObjectURL(blobRev);
    console.log("rev added");

    chunks.length = 0; // TODO(@darzu): deleting chunks!!

    return {
      name,
      blob,
      url,

      reverseUrl,
    };
  }

  function createClipView(clip: Clip) {
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
    clipLabel.textContent = clip.name;

    clipContainer.appendChild(audio);
    clipContainer.appendChild(clipLabel);
    clipContainer.appendChild(selectButton);
    // clipContainer.appendChild(deleteButton);
    view.soundClips.appendChild(clipContainer);

    audio.controls = true;

    audio.src = clip.url;

    revAudio.src = clip.reverseUrl;

    let selectOK = true; // TODO(@darzu): expose this state

    selectButton.onclick = () => {
      model.revLoc = model.clipCount - 1;
      if (selectOK) {
        // TODO(@darzu): deslect doesn't work?
        selectOK = false;
        model.audioElement = revAudio;
        selectButton.textContent = "Deselect Track";
      } else {
        selectOK = true;
        model.audioElement = document.querySelector("audio");
        selectButton.textContent = "Select Track";
      }

      // TODO(@darzu): HACK! don't call mainControl again!
      mainControll();
    };
  }

  mediaRecorder.onstop = (e) => {
    // TODO: split out view actions from data changes

    // model.clipCount++;
    const clip = createClip(chunks);

    createClipView(clip);

    console.log("recorder stopped");

    // deleteButton.onclick = function (e) {
    //     e.target.closest(".clip").remove();
    // };

    // model.clips.push(audio);
    // revArr.push(revAudio);
  };
}

function makeDistortionCurve(amount: number): Float32Array {
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

// stopButton.onclick = () =>{

// }

mainControll();

function initMainControl() {
  if (model.audioElement) {
    let AudioContext = window.AudioContext;
    if (model.audioCtx) model.audioCtx.close();
    model.audioCtx = new AudioContext();
    model.track = model.audioCtx.createMediaElementSource(model.audioElement);
    model.gainNode = model.audioCtx.createGain();
    model.panNode = new StereoPannerNode(model.audioCtx);
    model.distortionNode = model.audioCtx.createWaveShaper();
    if (model.distortionNode)
      model.distortionNode.curve = makeDistortionCurve(model.distAmt);
    setUpFaders();
    // reverb not working:
    // reverbNode = createReverb(audioCtx);

    //sets up initial audio graph
    model.track
      .connect(model.gainNode)
      .connect(model.panNode)
      .connect(model.audioCtx.destination);
  }
}

function setUpFaders() {
  view.volFader.addEventListener(
    "input",
    () => {
      if (model.gainNode)
        model.gainNode.gain.value = parseFloat(view.volFader.value);
    },
    false
  );
  view.panFader.addEventListener(
    "input",
    () => {
      if (model.panNode)
        model.panNode.pan.value = parseFloat(view.panFader.value);
    },
    false
  );
}

// TODO(@darzu): remove multiple calls
function mainControll() {
  initMainControl();

  view.reverseButton.onclick = async () => {
    const aBuff = await rev();
    model.audioElement = await bufferToAudioElement(aBuff);
    async function bufferToAudioElement(
      audioBuffer: AudioBuffer
    ): Promise<HTMLAudioElement> {
      // Step 1: Create an AudioContext
      const audioContext = new AudioContext();

      // Step 2: Decode the audio buffer
      const audioBufferSource = audioContext.createBufferSource();
      audioBufferSource.buffer = audioBuffer;

      // Step 3: Create an HTML audio element
      const audioElement = new Audio();

      // Step 4: Set the source of the audio element
      const mediaSourceNode =
        audioContext.createMediaElementSource(audioElement);
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

    initMainControl();
  };

  //takes a url to an audio file and returns a promise to an AudioBuffer;
  function rev(): Promise<AudioBuffer> {
    const ctx = new AudioContext();
    // TODO(@darzu): read urls?
    return fetch(model.urlArr[model.revLoc])
      .then((data) => data.arrayBuffer())
      .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
      .then((revAudioBuffer) => reverseBuff(revAudioBuffer));
  }

  function reverseBuff(Buff: AudioBuffer): AudioBuffer {
    const numOfChannels = Buff.numberOfChannels;
    for (
      let channelNumber = 0;
      channelNumber < numOfChannels;
      channelNumber++
    ) {
      let startArr: Float32Array = new Float32Array();
      Buff.copyFromChannel(startArr, channelNumber);
      let revArr = new Float32Array();
      for (let i = 0; i < startArr.length; i++) {
        revArr[i] = startArr[startArr.length - 1 - i];
      }
      Buff.copyToChannel(revArr, channelNumber);
    }
    console.log("reversed the buff");
    return Buff;
  }

  // let distAmt = 400

  //file button now allows user to set the amount of distortion
  //this functionality should be moved to a fader in the fx div
  view.distAmtButton.onclick = () => {
    let dcInt = 0;
    const dc = prompt("enter dist curve");
    if (dc !== null) dcInt = parseInt(dc);
    model.distAmt = dcInt;
    if (model.distortionNode)
      model.distortionNode.curve = makeDistortionCurve(dcInt);

    // const fileName = prompt("Enter the name of a valid audio file. (eg: test.mp3)")
    // audioFile = "audio-files/"+fileName;
    // if(audioFile)
  };

  view.loopButton.onclick = () => {
    if (model.loop) {
      model.loop = false;
      view.loopButton.textContent = "Loop";
    } else {
      model.loop = true;
      view.loopButton.textContent = "Stop Loop";
    }
  };

  view.playButton.onclick = () => {
    if (!model.audioCtx) {
      initMainControl();
    }
    if (model.audioCtx) {
      if (model.audioCtx.state === "suspended") {
        model.audioCtx.resume();
      }
      if (view.playButton.dataset.play === "false") {
        play();
        // else throw "no audioElement";
      } else {
        if (model.audioElement) {
          model.audioElement.pause();
          view.playButton.dataset.play = "false";
          view.playButton.textContent = "Play";
        } else throw "no audioElement";
      }
    }
  };

  view.distortionButton.onclick = () => {
    if (!model.audioCtx) initMainControl();
    if (model.distortionNode && model.panNode && model.audioCtx) {
      if (model.distortionOn) {
        model.distortionOn = false;
        model.distortionNode.disconnect(model.audioCtx.destination);
        model.panNode.disconnect(model.distortionNode);
        model.panNode.connect(model.audioCtx.destination);
      } else {
        model.distortionOn = true;
        model.panNode.disconnect(model.audioCtx.destination);
        model.panNode
          .connect(model.distortionNode)
          .connect(model.audioCtx.destination);
      }
    }
  };

  // handles end of track and looping functionality
  if (model.audioElement) {
    model.audioElement.addEventListener(
      "ended",
      () => {
        if (model.loop) play();
        else {
          view.playButton.dataset.play = "false";
          view.playButton.textContent = "Play";
        }
      },
      false
    );
  }

  function play() {
    if (model.audioElement) {
      model.audioElement.play();
      view.playButton.dataset.play = "true";
      view.playButton.textContent = "Pause";
    }
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

function GenerateHomePage() {
  const homepage = document.createElement("div");
  homepage.setAttribute("id", "home");
  homepage.setAttribute("class", "home");
  const logo = document.createElement("img");
  logo.setAttribute("src", "images/web-audio2.svg");
  logo.setAttribute("alt", "crappy logo");
  homepage.appendChild(logo);

  {
    // build recorder
    view.recorder.appendChild(view.recordButton);
    const clipText = document.createElement("h4");
    clipText.textContent = "Clips:";
    view.recorder.appendChild(clipText);
    view.recorder.appendChild(view.soundClips);
  }

  let masterDiv = document.createElement("div");
  masterDiv.setAttribute("class", "master");
  let fxDiv = document.createElement("div");
  fxDiv.setAttribute("class", "distortion");
  let masterText = document.createElement("h3");
  masterText.textContent = "Master";
  masterDiv.appendChild(masterText);
  let distortionText = document.createElement("h3");
  distortionText.textContent = "FX";
  fxDiv.appendChild(distortionText);
  // fileText = document.createElement("p");
  // fileText.textContent = "No file selected."
  // homepage.appendChild(fileText);
  homepage.appendChild(view.distAmtButton);
  masterDiv.appendChild(view.playButton);
  // homepage.appendChild(stopButton);
  masterDiv.appendChild(view.loopButton);
  fxDiv.appendChild(view.distortionButton);
  fxDiv.appendChild(view.reverseButton);
  const volText = document.createElement("h4");
  volText.textContent = "Volume";
  // const volFader = document.createElement("input");
  // volFader.type = "range";
  // volFader.id = "volume";
  // volFader.step = "0.01";
  // volFader.value = "1";
  // volFader.min = "0";
  // volFader.max = "2";
  masterDiv.appendChild(volText);
  masterDiv.appendChild(view.volFader);
  const panText = document.createElement("h4");
  panText.textContent = "Pan";
  // const panFader = document.createElement("input");
  // panFader.type = "range";
  // panFader.id = "pan";
  // panFader.step = "0.01";
  // panFader.value = "0";
  // panFader.min = "-1";
  // panFader.max = "1";
  masterDiv.appendChild(panText);
  masterDiv.appendChild(view.panFader);

  if (view.gridContainer !== null) {
    view.gridContainer.appendChild(homepage);
    view.gridContainer.appendChild(masterDiv);
    view.gridContainer.appendChild(fxDiv);
    view.gridContainer.appendChild(view.recorder);
  }
}
