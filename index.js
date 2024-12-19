// DOM utils

const el = (sel, par = document) => par.querySelector(sel);
const els = (sel, par = document) => par.querySelectorAll(sel);
const elNew = (tag, prop) => Object.assign(document.createElement(tag), prop);

// Utils

const repeat = (n, cb) => [...Array(n)].forEach((_, i) => cb(i));
const mod = (n, m) => ((n % m) + m) % m; // Fix negative Modulo
const clip = (min, num, max) => Math.min(Math.max(num, min), max); // clamp value to min/max
const roundToNearest = (num, nearest) => Math.round(num / nearest) * nearest;
const calcScaleDelta = (value, delta, factor) => value * Math.exp(delta * factor);
const sec2time = (sec) => {
    let h = Math.floor(sec / 3600);
    let m = Math.floor(sec / 60) % 60;
    let s = sec % 60;
    m = sec < 3600 ? m : ":" + String(m).padStart(2, "0");
    s = sec < 60 ? s : ":" + String(s).padStart(2, "0");
    return `${h ? h : ""}${(h || m) ? m : ""}${s}`;
};

// Timeline basic component

const elTimeline = el(".timeline");
const elScroll = el(".scroll", elTimeline);
const elRuler = el(".ruler", elTimeline);
const elRulerTime = el("#ruler-time", elTimeline);
const elTime = el(".time", elTimeline);
const elZoomPercent = el("#zoom-percent", elTimeline);
const rulerCtx = elNew("canvas").getContext("2d");

const secPx = 10; // Default size of one second in pixels
const zoomFactor = 0.5;
const zoomMin = 0.02;
const zoomMax = 4;
let zoom = 1;

const drawRuler = () => {
    rulerCtx.canvas.width = elTimeline.offsetWidth;
    rulerCtx.canvas.height = 16;

    // Where to show main rulers and their times.
    // @TODO Write a cleaner algorithm for the below logic, eventually?
    let z = Math.round(zoom * 100);
    let everyNSec = 5;
    if (z === 100) everyNSec = 10;
    if (z < 70) everyNSec = 20;
    if (z < 40) everyNSec = 30;
    if (z < 30) everyNSec = 60;
    if (z < 15) everyNSec = 90;
    if (z < 10) everyNSec = 120;
    if (z < 6) everyNSec = 240;
    if (z < 4) everyNSec = 300;

    const rulerAt = secPx * zoom * everyNSec;
    const scrLeft = elTimeline.scrollLeft;
    const y = scrLeft - mod(scrLeft, rulerAt);
    const secStart = Math.round(y / rulerAt * everyNSec);

    let i = 0;
    let sec = secStart;
    while (i < rulerCtx.canvas.width) {
        const time = sec2time(sec);
        rulerCtx.font = "12px sans-serif";
        rulerCtx.fillStyle = "white";
        rulerCtx.textAlign = "center";
        rulerCtx.fillText(time, i, rulerCtx.canvas.height);
        sec += everyNSec;
        i += rulerAt;
    }

    const base64Image = rulerCtx.canvas.toDataURL();    
    elTimeline.style.setProperty("--rulerAt", rulerAt.toFixed(3));
    elTime.style.background = `url(${base64Image}) no-repeat ${y}px 0`;
};

elTimeline.addEventListener("pointermove", (evt) => {
    const { clientX } = evt;
    const pointerX = Math.max(0, clientX - elScroll.offsetLeft + elTimeline.scrollLeft);
    const secToPxScaled = secPx * zoom;
    // Snap the vertical pointer-ruler to the seconds rulers lines
    const snapX = (pointerX + secToPxScaled / 2) - ((pointerX + secToPxScaled / 2) % secToPxScaled);
    elRulerTime.textContent = sec2time(Math.round(snapX / secToPxScaled));
    elTimeline.style.setProperty("--pointer-x", snapX);
});

const updateZoom = (delta = 0) => {
    const zoomOld = zoom;    
    zoom = calcScaleDelta(zoom, delta, zoomFactor);
    zoom = zoom === 1 ? zoom : roundToNearest(zoom, 0.05); // fix Firefox repeating-linear-gradient 1px lines at tiny decinals
    zoom = Number(zoom.toFixed(2)); // fixes zoom-up calcs
    console.log(zoomOld, zoom);
    
    if (zoom < zoomMin || zoom > zoomMax) zoom = zoomOld;
    elTimeline.style.setProperty("--zoom", zoom);
    elZoomPercent.textContent = `${Math.round(zoom * 100)}%`;
    elTimeline.style.setProperty("--pointer-x", 0); // Fixes invalid timeline size on zoom-out
    drawRuler();
};

el("#zoom-out").addEventListener("click", () => {
    updateZoom(-1);
});
el("#zoom-in").addEventListener("click", () => {
    updateZoom(1);
});

// Events

elTimeline.addEventListener("scroll", () => {
    drawRuler();
});

addEventListener("resize", () => {
    drawRuler();
});

// Init

updateZoom();
