const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
x:60,
y:200,
r:35,
speed:16
};

let items = [];
let sparkles = [];

let gaugeP = 0;
let gaugeQ = 0;

let running = false;
let spawnTimer = null;

let boostActive = false;
let boostRemain = 0;
let lastFrameTime = Date.now();

const bgm = document.getElementById("bgm");
bgm.volume = 0.05;
const pickupSound = new Audio("pickup.mp3");
pickupSound.volume = 0.6;
const clearSound = new Audio("clear.mp3");
clearSound.volume = 0.3;
const boostSound = new Audio("boost.mp3");
boostSound.volume = 0.3;

const playerImage = new Image();
playerImage.src = "player.png";

const itemImages = {

A: new Image(),
B: new Image(),
C: new Image(),
D: new Image(),
E: new Image()

};

itemImages.A.src = "beer_glass.png";
itemImages.B.src = "drink_sparkling_wine.png";
itemImages.C.src = "drink_whisky_scotch.png";
itemImages.D.src = "medicine_cup_water.png";
itemImages.E.src = "kunsei_bacon.png";

const ITEM_SIZE = 25;

const itemTypes = {

A:{color:"orange",p:6,q:4,weight:50},
B:{color:"green",p:12,q:6,weight:25},
C:{color:"gold",p:20,q:20,weight:15},
D:{color:"cyan",p:-20,q:-10,weight:25},
E:{color:"yellow",p:0,q:0,weight:5}

};

function startGame(){

document.getElementById("titleScreen").style.display="none";
document.getElementById("gameScreen").style.display="block";

running=true;

bgm.muted = true;
bgm.play();
bgm.muted = false;

bgm.currentTime = 0;
bgm.play();

gameLoop();
spawnLoop();
decayLoop();
}

function pauseGame(){

running = false;

bgm.pause();

document.getElementById("pausePopup").classList.remove("hidden");

}

function resumeGame(){

running = true;

bgm.play();

lastFrameTime = Date.now();

document.getElementById("pausePopup").classList.add("hidden");

gameLoop();
spawnLoop();

}

function restartGame(){

running=false;

gaugeP=0;
gaugeQ=0;
items=[];
player.y=200;

boostActive=false;
boostEndTime=0;

updateGauge();

document.getElementById("clearPopup").classList.add("hidden");
document.getElementById("pausePopup").classList.add("hidden"); // ←追加

bgm.currentTime = 0;
bgm.play();

running=true;

gameLoop();
spawnLoop();

}

function backTitle(){

bgm.pause();
bgm.currentTime = 0;

location.reload();
}

document.addEventListener("keydown",e=>{

if(!running)return;

if(e.key==="ArrowUp") player.y-=player.speed;
if(e.key==="ArrowDown") player.y+=player.speed;

});

function spawnItem(){

let totalWeight = 0;

for(let t in itemTypes){
totalWeight += itemTypes[t].weight;
}

let r = Math.random() * totalWeight;

let sum = 0;
let type;

for(let t in itemTypes){

sum += itemTypes[t].weight;

if(r < sum){
type = t;
break;
}

}

items.push({

x:canvas.width,
y:Math.random()*(canvas.height-ITEM_SIZE*2)+ITEM_SIZE,
r:ITEM_SIZE,
type:type

});

}

function spawnLoop(){

if(spawnTimer) return;

spawnTimer = setInterval(()=>{

if(running){
spawnItem();
}

},1000);

}

function decayLoop(){

setInterval(()=>{

if(!running)return;

gaugeP=Math.max(0,gaugeP-3);
gaugeQ=Math.max(0,gaugeQ-3);

updateGauge();

},3000);

}

function updateGauge(){

document.getElementById("gaugeP").style.width=gaugeP+"%";
document.getElementById("gaugeQ").style.width=gaugeQ+"%";

}

function gameLoop(){

let now = Date.now();
let delta = now - lastFrameTime;
lastFrameTime = now;

if(!running) return;

ctx.clearRect(0,0,canvas.width,canvas.height);

player.y = Math.max(player.r, player.y);
player.y = Math.min(canvas.height - player.r, player.y);

drawPlayer();
moveItems();
drawItems();
checkCollision();
checkClear();

if(boostActive){

boostRemain -= delta;

if(boostRemain <= 0){
boostActive = false;
boostRemain = 0;
}

}

let icon = document.getElementById("boostIcon");
let ring = document.getElementById("boostRing");

if(icon && ring){

if(boostActive){

icon.classList.remove("hidden");

let ratio = Math.max(0, Math.min(1, boostRemain/10000));

let deg = ratio * 360;

ring.style.background =
`conic-gradient(yellow ${deg}deg, transparent 0deg)`;

}else{

icon.classList.add("hidden");

}

}

requestAnimationFrame(gameLoop);

}

function drawPlayer(){

ctx.save();

ctx.beginPath();
ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
ctx.clip();

ctx.drawImage(
playerImage,
player.x - player.r,
player.y - player.r,
player.r * 2,
player.r * 2
);

ctx.restore();

ctx.beginPath();
ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
ctx.strokeStyle="blue";
ctx.lineWidth=2;
ctx.stroke();

}

function drawItems(){

items.forEach(item=>{

let img = itemImages[item.type];

ctx.save();

ctx.beginPath();
ctx.arc(item.x,item.y,item.r,0,Math.PI*2);
ctx.clip();

ctx.drawImage(
img,
item.x - item.r,
item.y - item.r,
item.r * 2,
item.r * 2
);

ctx.restore();

ctx.beginPath();
ctx.arc(item.x,item.y,item.r,0,Math.PI*2);
ctx.strokeStyle = itemTypes[item.type].color;
ctx.lineWidth=1;
ctx.stroke();
if(item.type==="E"){
drawSparkle(item.x,item.y);
}

});

}

let sparkleTime = 0;

function drawSparkle(x,y){

if(Date.now() - sparkleTime > 200){

sparkles = [];

for(let i=0;i<6;i++){

let angle = Math.random()*Math.PI*2;
let dist = Math.random()*30;

sparkles.push({
dx: Math.cos(angle)*dist,
dy: Math.sin(angle)*dist,
size: 4+Math.random()*3
});

}

sparkleTime = Date.now();

}

sparkles.forEach(s=>{

ctx.beginPath();
ctx.arc(x + s.dx, y + s.dy, s.size, 0, Math.PI*2);

ctx.fillStyle="yellow";
ctx.shadowColor="yellow";
ctx.shadowBlur=10;

ctx.fill();

ctx.shadowBlur=0;

});

}

function moveItems(){

items.forEach(item=>{

item.x-=3;

});

items=items.filter(item=>item.x>-20);

}

function checkCollision(){

for(let i = items.length - 1; i >= 0; i--){

let item = items[i];

let dx = player.x - item.x;
let dy = player.y - item.y;

let dist = Math.sqrt(dx*dx + dy*dy);

if(dist < player.r + item.r){

let type = itemTypes[item.type];

if(item.type === "E"){

boostActive = true;
boostRemain = 10000;

boostSound.currentTime = 0;
boostSound.play().catch(()=>{});

items.splice(i,1);
continue;

}

let pGain = type.p;
let qGain = type.q;

if(boostActive && (item.type==="A" || item.type==="B" || item.type==="C")){
pGain *= 1.2;
qGain *= 1.5;
}

gaugeP = Math.max(0,Math.min(100,gaugeP+pGain));
gaugeQ = Math.max(0,Math.min(100,gaugeQ+qGain));

pickupSound.currentTime = 0;
pickupSound.play().catch(()=>{});

updateGauge();

items.splice(i,1);

}

}

}

function checkClear(){

if(gaugeP===100 && gaugeQ===100){

clearGame("★★★","酒柱");

}

else if(gaugeP===100){

clearGame("★☆☆","泥酔柱");

}

else if(gaugeQ===100){

clearGame("★★☆","ほろ酔い柱");

}

}

function clearGame(star,text){

running=false;

bgm.pause();

clearSound.currentTime = 0;
clearSound.play().catch(()=>{});

document.getElementById("clearPopup").classList.remove("hidden");

document.getElementById("clearTitle").innerText=star;
document.getElementById("clearText").innerText=text;

}

canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);

function handleTouch(e){

e.preventDefault();

let rect = canvas.getBoundingClientRect();

let touchY = e.touches[0].clientY - rect.top;

player.y = touchY;

}