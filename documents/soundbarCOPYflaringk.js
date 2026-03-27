// getMSPFAletiables
const getMSPFAletiablesAudio = (identifier) => {
  // Moved here to avoid compatibility issues
  const letRegexp = /"(.*?)"|\S+/g;
  const removeQuotesRegex = /[^\"].*[^\"]|[^\"]/g;
  
  const lineRegexp = new RegExp(`@mspfa ${identifier}(.*?);`, 'g');
  const foundLines = [...MSPFA.story.y.matchAll(lineRegexp)];

  const output = foundLines.map((block) => {
    let lets = [...block[0].slice(0, -1).matchAll(letRegexp)].splice(2);
    return lets.map((arr) => arr[0].match(removeQuotesRegex)[0]);
  })

  return output;
};

// Normal code
let soundhidden = false
let audiolist = getMSPFAletiablesAudio("audio")

let audio1
let audio2
let currentAudioElement
let wrapdiv
let songinfo

let doFadeOut = false
let doFadeOutTime

let nofadeargs = getMSPFAletiablesAudio("nofade")
let nofadeout = []
let nofadein = []

// Create Style
let createStyle = () => {
  let style = document.createElement("style")
  style.textContent = `#soundbar {
    position: fixed;
    left: 1em;
    min-height: 10px;
    min-width: 10px;
    background: black none repeat scroll 0% 0%;
    padding: 1em;
    border-color: yellow yellow currentcolor;
    border-style: solid solid none;
    border-width: 5px 5px medium;
    border-image: none 100% / 1 / 0 stretch;
    outline: orange solid 5px;
    transition: bottom 0.5s ease 0s;
    font-family: "Press Start 2P";
    color: white;
    bottom: 0px;
  }
  #soundbar button {
    position: absolute;
    height: 40px;
    left: -5px;
    background: black none repeat scroll 0% 0%;
    color: white;
    border: 5px solid yellow;
    outline: orange solid 5px;
    bottom: calc(118px);
    font-family: "Press Start 2P";
    padding: 0.4em;
  }
  #songinfo {
    margin-bottom: 5px;
  }`
  document.head.prepend(style)
}

// Create no fade list
let createNoFadeList = () => {
  nofadeargs.forEach(args => {
    let direction = args.length == 2 ? args[1] : "inout"
    if (direction.includes("in")) { nofadein.push(parseInt(args[0])) }
    if (direction.includes("out")) { nofadeout.push(parseInt(args[0])) }
  })
}

// Create Soundbar
let createSoundBar = () => {
  wrapdiv = document.createElement('div')

  // Add elements
  const sounddiv = document.createElement("div")
  sounddiv.style = "bottom: 0;"
  sounddiv.id = "soundbar"

  const button = document.createElement("button")
  button.innerText = "Music Controls ▼"
  button.onclick = () => { 
    sounddiv.style = !soundhidden ? "bottom: calc(-5px - " + sounddiv.offsetHeight + "px);" : "bottom: 0;"
    soundhidden ^= true
    button.innerText = soundhidden ? "Music Controls ▲" : "Music Controls ▼"
  }
  sounddiv.appendChild(button)

  songinfo = document.createElement("div")
  songinfo.id = "songinfo"
  songinfo.innerText = "Now Playing: \nGetting title..."
  songinfo.style.marginBottom = "5px"
  sounddiv.appendChild(songinfo)

  audio1 = document.createElement("audio")
  audio1.controls = true
  audio1.autoplay = true
  audio1.loop = true
  audio1.src = ""
  sounddiv.appendChild(audio1)

  audio2 = document.createElement("audio")
  audio2.controls = false
  audio2.autoplay = true
  audio2.loop = true
  audio2.volume = 0
  audio2.src = ""
  sounddiv.appendChild(audio2)

  currentAudioElement = audio1

  wrapdiv.appendChild(document.createElement("br"))
  wrapdiv.appendChild(sounddiv)

  document.body.appendChild(wrapdiv)

  //Set button bottom with bar height
  button.style = " bottom: calc(" + sounddiv.offsetHeight + "px + 15px);"
}

let updateaudio = () => {
  let isaudio = false
  audiolist.forEach(a => {
    // // min and max pages
    // let min = a[0] ? parseInt(a[0]) : 0
    // let max = a[1] ? parseInt(a[1]) : min

    // // if a[2] is a link, then the source must be a[2] and there is no volume argument, else volume is a[2]
    // let src = a[2].includes("https://") ? a[2] : a[3]
    // let vol = src == a[3] ? Math.max(0, Math.min(1, parseFloat(a[2]))) : 1

    // let fade = src == a[3] ? a[4] : a[3]
    // let fadeTime = src == a[3] ? parseFloat(a[5]) : parseFloat(a[4])

    // Hi flare i hope you dont mind i made a small change
    // Hi thank you this is way better
    let linkOffset = a.findIndex(v => v.includes('https://'));
    // console.log(linkOffset);
    let volumeIndex = -1;
    let min = 0;
    let max = 0;
    let vol = 1;

    // If there's one argument before the link's index
    if (linkOffset === 1) {
      // If first argument is volume
      if (parseFloat(a[0]) != 0 && parseFloat(a[0]) < 1) {
        volumeIndex = 0;
      } else {
        max = min = parseInt(a[0]);
      }
    }
    // ...if there's two...
    else if (linkOffset === 2) {
      if (parseFloat(a[1]) != 0 && parseFloat(a[1]) < 1) {
        volumeIndex = 1;
        max = min = parseInt(a[0]);
      } else {
        min = parseInt(a[0]);
        max = parseInt(a[1]);
      }
    }
    // ...and if there's three.
    else if (linkOffset === 3) {
      volumeIndex = 2;
      min = parseInt(a[0]);
      max = parseInt(a[1]);
    }

    if (volumeIndex !== -1) {
      vol = Math.max(0, Math.min(1, parseFloat(a[volumeIndex])))
    }

    let src = a[linkOffset]

    let fade = a[linkOffset+1]
    let fadeTime = parseFloat(a[linkOffset+2])

    fade = fade ? fade : ""
    fadeTime = fadeTime ? fadeTime : 2

    // If replacing song
    if (MSPFA.p >= min && (max === 0 || MSPFA.p <= max)) {
      if (currentAudioElement.src !== src) {
        // Fade out
        if (doFadeOut && !nofadeout.includes(MSPFA.p)) fadeAudioOut(currentAudioElement.volume, currentAudioElement.currentTime, doFadeOutTime)

        // set new song
        currentAudioElement.src = src
        currentAudioElement.currentTime = 0
        
        // Fade in new song
        if (fade.includes("in") && !nofadein.includes(MSPFA.p)) {
          currentAudioElement.volume = 0
          fadeAudioIn(vol, fadeTime)
        } else {
          currentAudioElement.volume = vol
        }

        wrapdiv.style = "opacity: 1; transition: opacity 0.5s; height: 0; pointer-events: auto;"

        // Fade out init
        doFadeOut = fade.includes("out")
        doFadeOutTime = fadeTime
      }

      songinfo.innerText = "Now Playing: \n" + getTitle(src)
      isaudio = true

    }
  })

  // If no new song
  if (!isaudio) {
    // Fade out
    if (doFadeOut) {
      if (!nofadeout.includes(MSPFA.p)) {
        fadeAudioOut(currentAudioElement.volume, currentAudioElement.currentTime, doFadeOutTime)
      }
      doFadeOut = false
    }

    currentAudioElement.src = ""
    currentAudioElement.volume = 0
    wrapdiv.style = "opacity: 0; transition: opacity 0.5s; pointer-events: none;"
  }
}

// Fade in
let fadeAudioIn = (setVolume, fadeTime) => {
  let fadeInInterval = setInterval(() => {

    let newVolume = currentAudioElement.volume
    newVolume += setVolume / fadeTime / 10 

    // accounts for float error
    if (currentAudioElement.volume + setVolume / fadeTime / 10 >= setVolume) {
      clearInterval(fadeInInterval)
      newVolume = setVolume
    }

    newVolume = Math.min(Math.max(newVolume, 0), 1)

    currentAudioElement.volume = newVolume

  }, 100)
}

// Fade out
let fadeAudioOut = (currentVolume, currentTime, fadeTime) => {
  // switch audio element to avoid gap in audio
  let fadingOutAudio = currentAudioElement == audio1 ? audio1 : audio2
  currentAudioElement = currentAudioElement == audio2 ? audio1 : audio2

  fadingOutAudio.controls = false
  currentAudioElement.controls = true

  let fadeOutInterval = setInterval(() => {
    // accounts for float error
    if (fadingOutAudio.volume - currentVolume / fadeTime / 10 <= 0) {
      clearInterval(fadeOutInterval)
      fadingOutAudio.volume = 0
    } else {
      fadingOutAudio.volume -= currentVolume / fadeTime / 10
    }
  }, 100)
}

// Thanks Seymour
const getTitle = (link) => {
  link = link.split('/');
  link = link[link.length - 1];
  link = decodeURIComponent(link);
  link = link.split('.');
  link.pop();
  return link.join('.');
};

createStyle()
createSoundBar()
createNoFadeList()

updateaudio()
MSPFA.slide.push(() => {
  updateaudio()
});
