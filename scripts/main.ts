export const _foo = true;

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

const view = createView(); // TODO(@darzu): move into main

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

interface AppState {
  // TODO(@darzu): REMVOE
  revLoc: number;
  urlArr: string[];
  clipCount: number;

  audioElement: HTMLAudioElement | null;

  // state
  loop: boolean;
  distortionOn: boolean; // TODO(@darzu): MOVE
  distAmt: number;
}

// TODO(@darzu): move into main
const state: AppState = {
  revLoc: -1,
  loop: false,
  distortionOn: false,
  // gainNode: null,
  // panNode: null,
  // distortionNode: null,
  // audioCtx: null,
  audioElement: document.querySelector("audio"),
  urlArr: [],
  clipCount: 0,
  // stopRecord: false,
  distAmt: 400,
  // clips: [],
  // reverbNode: null,
  // delayNode: null,
};

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

interface Clip {
  name: string;
  blob: Blob;
  url: string;

  // TODO(@darzu): REVERSE
  reverseUrl: string;
}

let _nextClipId = 1;
function createClip(manager: MediaManager): Clip {
  const { _chunks: chunks, mediaRecorder } = manager;
  // TODO(@darzu):

  const name = `Clip ${_nextClipId}`;
  _nextClipId += 1;

  const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
  // chunks = [];
  const url = window.URL.createObjectURL(blob);

  // TODO(@darzu): HACK. remove urlArr ??
  state.urlArr.push(url);

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
    state.revLoc = state.clipCount - 1;
    if (selectOK) {
      // TODO(@darzu): deslect doesn't work?
      selectOK = false;
      state.audioElement = revAudio;
      selectButton.textContent = "Deselect Track";
    } else {
      selectOK = true;
      state.audioElement = document.querySelector("audio");
      selectButton.textContent = "Select Track";
    }

    // TODO(@darzu): HACK! don't call mainControl again!
    recreateAudioGraphAndView();
  };
}

function initMediaView(manager: MediaManager) {
  const { mediaRecorder } = manager;

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

  mediaRecorder.onstop = (e) => {
    const clip = createClip(manager);
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

interface AudioGraph {
  ctx: AudioContext;

  gain: GainNode;
  pan: StereoPannerNode;
  distortion: WaveShaperNode;
}

// TODO(@darzu): allow swapping source nodes

function createAudioGraph(htmlAudio: HTMLAudioElement): AudioGraph {
  assert(htmlAudio);

  console.log(`creating graph`);

  // TODO(@darzu): does this close all the old nodes???

  const ctx = new AudioContext();

  const track = ctx.createMediaElementSource(htmlAudio);

  const gain = ctx.createGain();

  const pan = new StereoPannerNode(ctx);

  const distortion = ctx.createWaveShaper();
  assert(distortion); // TODO(@darzu): unnecessary assert?

  distortion.curve = makeDistortionCurve(state.distAmt);

  // reverb not working:
  // reverbNode = createReverb(audioCtx);

  //sets up initial audio graph
  track.connect(gain).connect(pan).connect(ctx.destination);

  const graph: AudioGraph = {
    ctx,
    // track,
    gain,
    pan,
    distortion,
  };

  attachFaderKnobs(graph);

  return graph;
}

function attachFaderKnobs(graph: AudioGraph) {
  // TODO(@darzu): TEST pan and gain work
  view.volFader.oninput = () => {
    graph.gain.gain.value = parseFloat(view.volFader.value);
  };
  view.panFader.oninput = () => {
    graph.pan.pan.value = parseFloat(view.panFader.value);
  };
}

let _lastGraph: AudioGraph | undefined;
function recreateAudioGraphAndView() {
  assert(state.audioElement);

  if (_lastGraph) _lastGraph.ctx.close();

  // TODO(@darzu): don't recreate graph like this?
  const graph = createAudioGraph(state.audioElement);

  _lastGraph = graph;

  attachViewToGraph(graph);
}

// TODO(@darzu): remove multiple calls
function attachViewToGraph(graph: AudioGraph) {
  view.reverseButton.onclick = async () => {
    const aBuff = await rev();
    state.audioElement = await bufferToAudioElement(aBuff);
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

    // TODO(@darzu): GRAPH recreate seems odd
    // TODO(@darzu): REVERSE
    // _lastGraph = createAudioGraph(model.audioElement, _lastGraph);
  };

  //takes a url to an audio file and returns a promise to an AudioBuffer;
  function rev(): Promise<AudioBuffer> {
    const ctx = new AudioContext();
    // TODO(@darzu): read urls?
    return fetch(state.urlArr[state.revLoc])
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
    state.distAmt = dcInt;

    // TODO(@darzu): refactor distortion state change
    graph.distortion.curve = makeDistortionCurve(dcInt);

    // const fileName = prompt("Enter the name of a valid audio file. (eg: test.mp3)")
    // audioFile = "audio-files/"+fileName;
    // if(audioFile)
  };

  view.loopButton.onclick = () => {
    if (state.loop) {
      state.loop = false;
      view.loopButton.textContent = "Loop";
    } else {
      state.loop = true;
      view.loopButton.textContent = "Stop Loop";
    }
  };

  view.playButton.onclick = () => {
    assert(state.audioElement);

    if (graph.ctx.state === "suspended") {
      graph.ctx.resume();
    }
    if (view.playButton.dataset.play === "false") {
      play();
      // else throw "no audioElement";
    } else {
      state.audioElement.pause();
      view.playButton.dataset.play = "false";
      view.playButton.textContent = "Play";
    }
  };

  view.distortionButton.onclick = toggleDistortion;

  function toggleDistortion() {
    assert(graph.distortion && graph.pan && graph.ctx);

    if (state.distortionOn) {
      state.distortionOn = false;
      graph.distortion.disconnect(graph.ctx.destination);
      graph.pan.disconnect(graph.distortion);
      graph.pan.connect(graph.ctx.destination);
    } else {
      state.distortionOn = true;
      graph.pan.disconnect(graph.ctx.destination);
      graph.pan.connect(graph.distortion).connect(graph.ctx.destination);
    }
  }

  // handles end of track and looping functionality
  assert(state.audioElement);

  state.audioElement.addEventListener(
    "ended",
    () => {
      if (state.loop) play();
      else {
        view.playButton.dataset.play = "false";
        view.playButton.textContent = "Play";
      }
    },
    false
  );

  function play() {
    assert(state.audioElement);

    state.audioElement.play();
    view.playButton.dataset.play = "true";
    view.playButton.textContent = "Pause";
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

async function main() {
  console.clear();

  GenerateHomePage();

  const _media = await initMedia();

  initMediaView(_media);

  recreateAudioGraphAndView();
}

main();
