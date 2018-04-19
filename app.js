//
// app.js
// by Jeremy Muller
// interactive web app for understanding pitch and rhythm ratios
//

var left, right, slider, oscil1, oscil2;
var width = 600;
var baseRate = 0.6;
var currentRatio = 3/2;
var longRatio = 5/3;
var shortRatio = 5/2;
var intervals = ["Maj2", "min3", "Maj3", "P4", "P5", "min6", "Maj6", "P8", "Maj10", "P12", "P15", "P15+M3", "P15+P5", "P15+P8"];
var loops = [];
var margin = 0;
var voice1 = [];
var voice2 = [];
var v1 = true;
var v2 = true;
var excerptSelection = 0;

var thaw = new Tone.Players({
    "v1" : "sounds/thaw_voice1.mp3",
    "v2" : "sounds/thaw_voice2.mp3"
}).toMaster();

// pluck synth doesn't work in all browsers
// var pluck = new Tone.PluckSynth().toMaster();

var pluck1 = new Tone.Player({
    "url" : "sounds/lowstring.wav",
    "fadeOut" : 0.5
}).toMaster();
var pluck2 = new Tone.Player({
    "url" : "sounds/highstring.wav",
    "fadeOut" : 0.1
}).toMaster();

var pulse = new Tone.Synth({
    "oscillator" : {
        "type" : "pulse",
        "width" : 0.5,
        "volume" : 3
    },
    "envelope" : {
        "attack" : 0.05, // 0.05
        "decay" : 0.1,
        "sustain" : 0.9,
        "release" : 1
    }
}).toMaster();

var woodblocks = new Tone.Players({
    "wb1" : "sounds/high_wb.wav",
    "wb2" : "sounds/high_wb.wav",
    "wb3" : "sounds/high_wb.wav",
    "wb4" : "sounds/high_wb.wav",
    "wb5" : "sounds/high_wb.wav",
    "wb6" : "sounds/high_wb.wav",
    "wb7" : "sounds/high_wb.wav",
}).toMaster();
woodblocks.get("wb2").playbackRate = 1.2;
woodblocks.get("wb3").playbackRate = 1.4;
woodblocks.get("wb4").playbackRate = 1.6;
woodblocks.get("wb5").playbackRate = 1.8;
woodblocks.get("wb6").playbackRate = 2.0;
woodblocks.get("wb7").playbackRate = 2.2;

var v1pat1 = new Tone.Pattern(function(time, note) {
    if (note != -1) {
        if (note == 0) v1pat1.stop();
        else {
            var wb = "wb" + note;
            woodblocks.get(wb).start(time);
        }
    }
}, [5, -1, 3, 4, -1, 5, 4, -1, 3, 5, -1, 4, 0], "up");
v1pat1.interval = 0.18518518518518517;

var v2pat1 = new Tone.Pattern(function(time, note) {
    if (note != -1) {
        if (note == 0) v2pat1.stop();
        else {
            var wb = "wb" + note;
            woodblocks.get(wb).start(time);
        }
    }
}, [1, 2, 2, 0], "up");
v2pat1.interval = 0.16203703703703703;
// v2pat1.interval = "(8n + 16n + 32n)/6"; // doesn't quite work

var v2pat2 = new Tone.Pattern(function(time, note) {
    if (note == 0 ) {
        v2pat2.stop();
    } else {
        var wb = "wb" + note;
        woodblocks.get(wb).start(time);
    }
}, [1, 2, 2, 1, 0]);
v2pat2.interval = 0.12152777777777779; // 0.060763888888888895

var v2pat3 = new Tone.Pattern(function(time, note) {
    if (note == 0) {
        v2pat3.stop();
    }
    else {
        var wb = "wb" + note;
        woodblocks.get(wb).start(time);
    }
}, [2, 2, 1, 0], "up");
v2pat3.interval = 0.16203703703703703;

var v2pat4 = new Tone.Pattern(function(time, note) {
    if (note == 0 ) {
        v2pat4.stop();
    } else {
        var wb = "wb" + note;
        woodblocks.get(wb).start(time);
    }
}, [2, 2, 1, 2, 0], "up");
v2pat4.interval = 0.12152777777777779;

var loop1 = new Tone.Loop(function(time) {
    woodblocks.get("wb1").start(time);
    Tone.Draw.schedule(function() {
        blink("blinkleft");
    }, time);
}, "4n/2");

var loop2 = new Tone.Loop(function(time) {
    woodblocks.get("wb2").start(time);
    Tone.Draw.schedule(function() {
        blink("blinkright");
    }, time);
}, "4n/3");

var rhythm = new Tone.Loop(function(time) {
    poly.triggerAttackRelease("C5", 0.05, time, 0.9);
}, "1m/5");

var metronome = new Tone.Loop(function(time) {
    var note = "A6";
    poly.triggerAttackRelease(note, 0.1, time, 0.9);
}, "4n");
// metronome.start("16m");

function init() {
    StartAudioContext(Tone.context);
    Nexus.context = Tone.context;
    Tone.Transport.start("+0.1");
    // Tone.Transport.bpm.value = 60; // 54
    document.getElementById("divider").style.height = "75px";
    document.getElementById("left").style.width = '' + (3/5*width-margin) + "px";
    document.getElementById("right").style.width = '' + (2/5*width-margin) + "px";

    for (var i = 0; i < 4; i++) {
        voice2[i] = new Tone.Pattern(function(time, note) {
            if (note == 0) {
                voice2[i].stop();
            }
            else {
                var wb = "wb" + note;
                woodblocks.get(wb).start(time);
            }
        }, [1, 2, 2, 0], "up");
    }
    voice2[0].values = [1, 2, 2, 0];
    voice2[1].values = [1, 2, 2, 1, 0];
    voice2[2].values = [2, 2, 1, 0];
    voice2[3].values = [2, 2, 1, 2, 0];

    voice2[0].interval = 0.16203703703703703;
    voice2[2].interval = 0.16203703703703703;
    voice2[1].interval = 0.12152777777777779;
    voice2[3].interval = 0.12152777777777779;

    oscil1 = new Nexus.Oscilloscope("#oscil1", {
        'size' : [3/5*width-margin, 75]
    });
    oscil1.connect(pluck1);
    oscil2 = new Nexus.Oscilloscope("#oscil2", {
        'size' : [2/5*width-margin, 75]
    });
    oscil2.connect(pluck2);

    /*********** PITCH ***********/
    var fundamental = new Nexus.Dial("#dial", {
        'size': [75,75],
        'interaction': 'vertical', // "radial", "vertical", or "horizontal"
        'mode': 'relative', // "absolute" or "relative"
        'min': 0.2,
        'max': 1,
        'step': 0,
        'value': 0.6
    });
    // fundamental.normalized = 2;
    fundamental.on('change', function(v) {
        baseRate = v;
    });

    left = new Nexus.Button("#buttonL", {
        'mode' : 'impulse',
        'size' : [50, 50]
    });
    right = new Nexus.Button("#buttonR", {
        'mode' : 'impulse',
        'size' : [50, 50]
    });

    left.on('change', function(v) {
        if (v) {
            pluck1.playbackRate = baseRate*longRatio;
            pluck1.start();
        }
    });

    right.on('change', function(v) {
        if (v) {
            pluck2.playbackRate = (baseRate*shortRatio)/2;
            pluck2.start();
        }
    });

    var radioButtons = new Nexus.RadioButton("#ratios", {
        'size' : [width-75, 30],
        'numberOfButtons' : 14,
        'active' : 4
    });

    radioButtons.on('change', function(v) {
        switch (v) {
            case 0: // 9:8
                movePivot(9, 8, v);
                currentRatio = 9/8;
                break;
            case 1: // 6:5
                movePivot(6, 5, v);
                currentRatio = 6/5;
                break;
            case 2: // 5:4
                movePivot(5, 4, v);
                currentRatio = 5/4;
                break;
            case 3: // 4:3
                movePivot(4, 3, v);
                currentRatio = 4/3;
                break;
            case 4: // 3:2
                movePivot(3, 2, v);
                currentRatio = 3/2;
                break;
            case 5: // 8:5
                movePivot(8, 5, v);
                currentRatio = 8/5;
                break;
            case 6: // 5:3
                movePivot(5, 3, v);
                currentRatio = 5/3;
                break;
            case 7: // 2:1
                movePivot(2, 1, v);
                currentRatio = 2/1;
                break;
            case 8: // 5:2
                movePivot(5, 2, v);
                currentRatio = 5/2;
                break;
            case 9: // 3:1
                movePivot(3, 1, v);
                currentRatio = 3/1;
                break;
            case 10: // 4:1
                movePivot(4, 1, v);
                currentRatio = 4/1;
                break;
            case 11: // 5:1
                movePivot(5, 1, v);
                currentRatio = 5/1;
                break;
            case 12: // 6:1
                movePivot(6, 1, v);
                currentRatio = 6/1;
                break;
            case 13: // 8:1
                movePivot(8, 1, v);
                currentRatio = 8/1;
                break;
        }
    });

    /*********** RHYTHM ***********/
    var startRhythm = new Nexus.Toggle("#toggle", {
        'size' : [40, 20],
        'state' : false
    });

    startRhythm.on('change', function(v) {
        if (v) {
            loop1.start();
            loop2.start();
        } else {
            loop1.stop();
            loop2.stop();
        }
    });

    var tempoSlider = new Nexus.Slider("#tempo", {
        'size' : [width/2, 20],
        'mode' : 'absolute',
        'min' : 20,
        'max' : 120,
        'value' : 60,
        'step' : 1
    });

    tempoSlider.on('change', function(v) {
        Tone.Transport.bpm.value = v;
    });

    var rhythmRatios = new Nexus.RadioButton("#rhythmratios", {
        // 2:1, 3:2, 4:3, 5:4, 6:5, 9:8
        'size' : [width/2, 30],
        'numberOfButtons' : 6,
        'active' : 1
    });
    rhythmRatios.on('change', function(v) {
        switch (v) {
            case 0: // 2:1
                changeRhythm(2, 1);
                break;
            case 1: // 3:2
                changeRhythm(3, 2);
                break;
            case 2: // 4:3
                changeRhythm(4, 3);
                break;
            case 3: // 5:4
                changeRhythm(5, 4);
                break;
            case 4: // 6:5
                changeRhythm(6, 5);
                break;
            case 5: // 9:8
                changeRhythm(9, 8);
                break;
        }
    });

    var startNested = new Nexus.TextButton("#playnested", {
        'size' : [150, 50],
        'state' : false,
    });
    startNested.on('change', function(v) {
        if (v) {
            switch (excerptSelection) {
                case 0:
                    var noteValue = 8;
                    Tone.Transport.bpm.value = 54 * noteValue/4;
                    playExcerpt1();
                    break;
                case 1:
                    var noteValue = 8;
                    Tone.Transport.bpm.value = 54 * noteValue/4;
                    playExcerpt2();
                    break;
                case 2:
                    // Thaw
                    playExcerpt3();
                    break;
            }
        } else {

        }
    });

    var voice1mute = new Nexus.Toggle("#voice1_mute", {
        'size': [60,20],
        'state': true
    });
    voice1mute.on('change', function(v) {
        v1 = v;
    })

    var voice2mute = new Nexus.Toggle("#voice2_mute", {
        'size': [60,20],
        'state': true
    });
    voice2mute.on('change', function(v) {
        v2 = v;
    })

    var nestedRatios = new Nexus.RadioButton("#nestedratios", {
        'size' : [width/4, 30],
        'numberOfButtons' : 3,
        'active' : 0
    });
    nestedRatios.on('change', function(v) {
        changeExcerpt(v);
        setPatterns(v);
        excerptSelection = v;
    });
}

function draw() {
	requestAnimationFrame(draw);
    var transport = Tone.Transport.seconds.toFixed(3);
    document.querySelector('p').textContent = "bars: " + Tone.Time(transport).toBarsBeatsSixteenths();
}

function movePivot(l, r, index) {
    var sum = l+r;
    longRatio = sum/l;
    shortRatio = sum/r;
    document.getElementById("left").style.width = '' + (l/sum*width-margin) + "px";
    document.getElementById("right").style.width = '' + (r/sum*width-margin) + "px";
    oscil1.resize(l/sum*width-margin, 75);
    oscil2.resize(r/sum*width-margin, 75);
    var d = '' + l + ':' + r + ' ' + intervals[index];
    document.getElementById("display").innerHTML = d;
    document.getElementById("staff").src = "img/" + intervals[index] + ".png";
}

function calculateTempo() {
    // TODO:
    // formula: n/d * dv * t/tv
    // n = numerator
    // d = denominator
    // dv = denominator value
    // t = tempo
    // tv = tempo value (note quality)
    // convert BPM to Hz: 60/bpm = Hz
    /**************/
    // child tempo:
    // pt = n/d * dv * t/tv
    // child tempo = n2/d2 * dv2/dv * pt
    // 60 / child tempo
    // pt = parent tempo
}

function changeRhythm(c, p) {
    loop1.interval = "4n/" + p;
    loop2.interval = "4n/" + c
    document.getElementById("displayrhythm").innerHTML = '' + c + ':' + p;
}

function changeExcerpt(v) {
    var element = document.getElementsByTagName("figcaption")[0];
    var img = document.getElementById("nestedrhythms");
    switch (v) {
        case 0:
            element.innerHTML = "Brian Ferneyhough, <em>Bone Alphabet</em> mm. 2";
            img.src = "img/BoneAlphabetMM2.png";
            break;
        case 1:
            element.innerHTML = "Brian Ferneyhough, <em>Bone Alphabet</em> mm. 54";
            img.src = "img/BoneAlphabetMM54.png";
            break;
        case 2:
            element.innerHTML = "Stuart Saunders Smith, <em>Thaw</em> bottom of page 1";
            img.src = "img/Thaw.png";
            break;
    }
}

function blink(name) {
    document.getElementById(name).style.background = "#000";
    setTimeout(function() {
        document.getElementById(name).style.background = "#eee";
    }, 75);
}

function playExcerpt1() {
    Tone.Transport.schedule(function(time) {
        if (v1) v1pat1.start(time);
        if (v2) {
            var sums = [];
            sums[0] = (v2pat1.values.length-1) * Tone.Time(v2pat1.interval).toSeconds();
            sums[1] = sums[0] + (v2pat2.values.length-1) * Tone.Time(v2pat2.interval).toSeconds();
            sums[2] = sums[1] + (v2pat3.values.length-1) * Tone.Time(v2pat3.interval).toSeconds();
            v2pat1.start(time);
            v2pat2.start(sums[0] + time);
            v2pat3.start(sums[1] + time);
            v2pat4.start(sums[2] + time);
        }
    }, Tone.now());
}

function playExcerpt2() {
    Tone.Transport.schedule(function(time) {
        if (v1) v1pat1.start(time);
        if (v2) {
            var sum = (v2pat1.values.length-1) * Tone.Time(v2pat1.interval).toSeconds();
            v2pat1.start(time);
            v2pat2.start(sum + time);
        }
    }, Tone.now());
}

function playExcerpt3() {
    // because of loading so many samples and sequences on this page,
    // already being somewhat bulky when loading,
    // it was better to just create these sequences in their own audio files

    if (v1) thaw.get("v1").start();
    if (v2) thaw.get("v2").start();
}

function setPatterns(v) {
    switch (v) {
        case 0:
            // voice 1
            v1pat1.values = [5, -1, 3, 4, -1, 5, 4, -1, 3, 5, -1, 4, 0];
            v1pat1.interval = 0.18518518518518517;
            // voice 2
            v2pat1.values = [1, 2, 2, 0];
            v2pat2.values = [1, 2, 2, 1, 0];
            v2pat3.values = [2, 2, 1, 0];
            v2pat4.values = [2, 2, 1, 2, 0];
            v2pat1.interval = 0.16203703703703703;
            v2pat2.interval = 0.12152777777777779;
            v2pat3.interval = 0.16203703703703703;
            v2pat4.interval = 0.12152777777777779;
            break;
        case 1:
            // voice 1
            v1pat1.values = [4, 6, 6, 5, 5, 5, 0];
            v1pat1.interval = 0.16203703703703703;
            // voice 2
            v2pat1.values = [1, 2, -1, 0];
            v2pat2.values = [3, 4, 4, 4, 2, 0];
            v2pat1.interval = 0.07407407407407407;
            v2pat2.interval = 0.17777777777777778;
            break;
        case 2:
            break;
    }
}
