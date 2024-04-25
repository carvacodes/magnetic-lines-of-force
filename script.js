let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

window.addEventListener("resize", function () {
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  filings.forEach(filing => {
    filing.x = Math.random() * innerWidth;
    filing.y = Math.random() * innerHeight;
  });
});

let numFilings = Math.round(innerWidth * 1.5);
let filingLength = 12;
let magWidth = innerWidth / 2;
let magHeight = magWidth / 7;
let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let moving = 0;
let magnetVisible = 1;
let poleN = mouseX - magWidth / 2 + magHeight / 2;
let poleS = mouseX + magWidth / 2 - magHeight / 2;

class Filing {
  constructor() {
    this.x = Math.random() * innerWidth;
    this.y = Math.random() * innerHeight;
    this.facing = Math.random() * 2;
    this.nearN;
    this.nearS;
    this.length = Math.random();
    this.dynamicSpeed = 0.02 + Math.random() * 0.02;
  }

  rotate() {
    let deltaX, deltaY, theta, pX, bias;
    if (this.x < mouseX) {
      pX = poleN;
      this.nearN = 1;
      this.nearS = 0;
    } else {
      pX = poleS;
      this.nearN = 0;
      this.nearS = 1;
    }
    if (this.x < poleN || this.x > poleS) {
      deltaX = pX - this.x;
      deltaY = mouseY - this.y;
      theta = Math.atan(deltaY / deltaX);
      if (this.nearS) {
        theta += Math.PI;
      }
    } else {
      bias = Math.abs((this.x - mouseX) / (pX - mouseX));
      deltaX = pX - this.x;
      deltaY = (mouseY - this.y) * bias;
      theta = Math.atan(deltaY / deltaX) + Math.PI;
      if (this.nearS) {
        theta += Math.PI;
      }
    }
    this.facing = theta / Math.PI;
  }

  drawNormal() {
    ctx.strokeStyle = this.nearN ? "#f00" : "#00f";
    let x1 = this.x + Math.cos(Math.PI * this.facing) * filingLength;
    let y1 = this.y + Math.sin(Math.PI * this.facing) * filingLength;
    let x2 = this.x + Math.cos(Math.PI * (this.facing + 1)) * filingLength;
    let y2 = this.y + Math.sin(Math.PI * (this.facing + 1)) * filingLength;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawDynamic() {
    this.length + this.dynamicSpeed >= 1
      ? ((this.length = 0),
        (this.x = Math.random() * innerWidth),
        (this.y = Math.random() * innerHeight),
        this.rotate())
      : (this.length += this.dynamicSpeed);
    let lightness = 60 * this.length;

    if (this.nearN) {
      ctx.strokeStyle = "hsl(0,100%," + lightness + "%)";
      let x1 = this.x +
        Math.cos(Math.PI * this.facing) * (filingLength * this.length * 2);
      let y1 = this.y +
        Math.sin(Math.PI * this.facing) * (filingLength * this.length * 2);

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "hsl(240,100%," + lightness + "%)";
      ctx.strokeStyle = this.nearN
        ? "hsl(0,100%," + lightness + "%)"
        : "hsl(240,100%," + lightness + "%)";
      let x1 = this.x -
        Math.cos(Math.PI * this.facing) * (filingLength * this.length * 2);
      let y1 = this.y -
        Math.sin(Math.PI * this.facing) * (filingLength * this.length * 2);

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }
}

let filings = [];

for (let i = 0; i < numFilings; i++) {
  filings.push(new Filing());
  filings[i].rotate();
}

document.addEventListener("mousemove", handleMove, {passive: false});
document.addEventListener("touchmove", handleMove, {passive: false});

document.addEventListener("click", handleClick);

function handleMove(e) {
  e.preventDefault();
  if (e.changedTouches) {
    e = e.touches[0];
  }
  
  mouseX = e.clientX;
  mouseY = e.clientY;
  moving = 1;
  poleN = mouseX - magWidth / 2 + magHeight / 2;
  poleS = mouseX + magWidth / 2 - magHeight / 2;
}

function handleClick(e) {
  e.preventDefault();
  magnetVisible = magnetVisible ? 0 : 1;
}

function drawMagnet() {
  ctx.fillStyle = "#a22";
  ctx.fillRect(
    mouseX - magWidth / 2,
    mouseY - magHeight / 2,
    magWidth / 2,
    magHeight
  );
  ctx.fillStyle = "#22a";
  ctx.fillRect(mouseX, mouseY - magHeight / 2, magWidth / 2, magHeight);

  
}

function drawAttrPoints() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(poleN - 1, mouseY - 1, 2, 2);
  ctx.fillRect(poleS - 1, mouseY - 1, 2, 2);
}

let currentTime = Date.now();

function animate() {
  let frameTime = Date.now();

  if (frameTime - currentTime < 16) {
    window.requestAnimationFrame(animate);
    return;
  }

  frameTime = currentTime;

  if (magnetVisible) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }

  for (let i = 0; i < filings.length; i++) {
    if (magnetVisible) {
      filings[i].drawNormal();
    } else {
      filings[i].drawDynamic();
    }
    if (moving) {
      filings[i].rotate();
    }
  }

  if (mouseX && magnetVisible) {
    drawMagnet();
  } else {
    drawAttrPoints();
  }

  moving = 0;
  window.requestAnimationFrame(animate);
}

animate();
