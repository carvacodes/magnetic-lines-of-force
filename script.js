window.addEventListener('load', ()=>{

  /*************************/
  /*                       */
  /*        Classes        */
  /*                       */
  /*************************/

  class Filing {
    constructor() {
      this.x = Math.random() * innerWidth;    // x coordinate
      this.y = Math.random() * innerHeight;   // y coordinate
      this.facing = Math.random() * 2;        // the filing's facing angle
      this.nearN;                             // a boolean indicating that the filing is nearer the north magnet pole
      this.nearS;                             // a boolean indicating that the filing is nearer the south magnet pole
      this.length = Math.random();            // the filing's length factor. multiplied by the global filingLength to get length during drawDynamic()
      this.dynamicSpeed = 0.5;                // the filing's draw speed during drawDynamic()
      this.drawingFromOrigin = true;          // controls whether the filing is drawing from x,y to its current animation length position or from its current animation length position to its max length
      this.distanceToPoles = {n: 0, s: 0};    // tracks the filing's distance to each magnet pole
      this.pullStrength = 1;                  // animation/rotation speed factor that decreases with the square of the distance from the nearest magnet pole

      this.getDistanceToPoles();              // get pole distances on initialization
    }
    
    ////////////////////////////
    //        rotate()        //
    ////////////////////////////
    rotate() {
      let deltaX, deltaY, theta, pX, bias;
      // set nearest-pole properties
      if (this.x < mouseX) {
        pX = poleN.x;
        this.nearN = true;
        this.nearS = false;
      } else {
        pX = poleS.x;
        this.nearN = false;
        this.nearS = true;
      }

      bias = Math.abs((this.x - mouseX) / (pX - mouseX));
      deltaX = pX - this.x;
      deltaY = (mouseY - this.y) * bias;
      theta = Math.atan(deltaY / deltaX) + Math.PI;

      // rotate the filing another 180 degrees if on the left side of a magnet pole (compensates for extra theta rotation)
      if ((this.nearS && this.x < poleS.x) || (this.nearN && this.x < poleN.x)) {
        theta += Math.PI;
      }
      
      this.facing = theta / Math.PI;
      this.getDistanceToPoles();
      this.getPullStrength();
    }

    ////////////////////////////////
    //        drawStatic()        //
    ////////////////////////////////
    drawStatic() {
      // draw filings closer to the left side in red, filings closer to the right side in blue
      // ctx.strokeStyle = this.nearN ? "#f00" : "#00f";
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      // draw each filing at the correct orientation using its facing angle
      let x1 = this.x + Math.cos(Math.PI * this.facing) * filingLength / 2;
      let y1 = this.y + Math.sin(Math.PI * this.facing) * filingLength / 2;
      let x2 = this.x + Math.cos(Math.PI * (this.facing + 1)) * filingLength / 2;
      let y2 = this.y + Math.sin(Math.PI * (this.facing + 1)) * filingLength / 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    /////////////////////////////////
    //        drawDynamic()        //
    /////////////////////////////////
    drawDynamic(refreshThrottle) {
      // if the filing animation would have it animate through a pole, or if it has completed a full animation cycle, reset its animation
      if ((this.length >= 1 && !this.drawingFromOrigin) || this.distanceToPoles.n - this.length * filingLength <= 0 || this.distanceToPoles.s - this.length * filingLength <= 0) {
        this.length = 0;
        this.drawingFromOrigin = true;
      } else if (this.length >= 1 && this.drawingFromOrigin) {    // if a filing animation has reached length == 1 but it is on its first phase of animation, reset its length and start animation phase 2
        this.length = 0;
        this.drawingFromOrigin = false;
      } else {
        this.length += this.dynamicSpeed * refreshThrottle * this.pullStrength;   // otherwise, update a filing's animation length
      }

      // this normalizes the distance to the nearest pole on a scale of 20, where a value of 20 is on a magnet pole and a value of 0 is infinitely far away
      let distFactor20 = this.nearN ? Math.round(20 * (1 - (this.distanceToPoles.n / maxDistance))) : Math.round(20 * (1 - (this.distanceToPoles.s / maxDistance)));

      // draw filings closer to the left side in red, filings closer to the right side in blue
      // filings between the two poles should be on a gradient from blue to red depending on their proximity to one pole or the other
      if (this.x < poleN.x) {
        ctx.strokeStyle = `hsl(360, 100%, ${30 + distFactor20}%)`;
      } else if (this.x > poleS.x) {
        ctx.strokeStyle = `hsl(240, 100%, ${30 + distFactor20}%)`;
      } else {
        ctx.strokeStyle = `hsl(${360 - (120 * (Math.abs(this.x - poleN.x) / magWidth))}, 100%, ${30 + distFactor20}%)`;
      }
      
      // use heavier line widths for filings closer to a magnet pole
      ctx.lineWidth = 2 * (distFactor20 / 20);
      
      // store the angle bases here to avoid repeated sin/cos calculations
      let xAngleBasis = Math.cos(Math.PI * this.facing);
      let yAngleBasis = Math.sin(Math.PI * this.facing);

      // the farthest point of a filing from the magnet pole
      let x1Basis = this.x - (xAngleBasis * (filingLength / 2));
      let y1Basis = this.y - (yAngleBasis * (filingLength / 2));

      // the nearest point of a filing to a magnet pole
      let x2Basis = this.x + (xAngleBasis * (filingLength / 2));
      let y2Basis = this.y + (yAngleBasis * (filingLength / 2));

      // set the line start point to the filing's farthest-possible-from-pole point in anim phase 1, or to `this.length` of the way past the farthest-from-pole point in anim phase 2
      let x1 = this.drawingFromOrigin ? x1Basis : x1Basis + (xAngleBasis * (filingLength) * this.length);
      let y1 = this.drawingFromOrigin ? y1Basis : y1Basis + (yAngleBasis * (filingLength) * this.length);

      // set the line end point to `this.length` of the way past the nearest-to-pole point in anim phase 1, or to the nearest-possible-to-pole point in anim phase 2
      let x2 = this.drawingFromOrigin ? x1Basis + (xAngleBasis * (filingLength) * this.length) : x2Basis;
      let y2 = this.drawingFromOrigin ? y1Basis + (yAngleBasis * (filingLength) * this.length) : y2Basis;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    ////////////////////////////////////////
    //        getDistanceToPoles()        //
    ////////////////////////////////////////
    getDistanceToPoles() {
      this.distanceToPoles.n = Math.round(Math.sqrt(Math.pow(this.x - poleN.x, 2) + Math.pow(this.y - poleN.y, 2)));
      this.distanceToPoles.s = Math.round(Math.sqrt(Math.pow(this.x - poleS.x, 2) + Math.pow(this.y - poleS.y, 2)));
    }

    /////////////////////////////////////
    //        getPullStrength()        //
    /////////////////////////////////////
    getPullStrength() {
      this.pullStrength = this.nearN ?
                          Math.pow(1 - (this.distanceToPoles.n / maxDistance), 2) :
                          Math.pow(1 - (this.distanceToPoles.s / maxDistance), 2);
    }
  }

  /*************************/
  /*                       */
  /*        Globals        */
  /*                       */
  /*************************/

  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext("2d");

  canvas.width = innerWidth;
  canvas.height = innerHeight;

  let maxDistance = Math.max(innerWidth, innerHeight);
  let filingLength = Math.min(maxDistance / 43, 24);
  let magWidth = innerWidth / 2;
  let magHeight = magWidth / 7;
  let mouseX = innerWidth / 2;
  let mouseY = innerHeight / 2;
  let moving = false;
  let magnetVisible = false;
  let poleN = { x: mouseX - magWidth / 2 + magHeight / 2, y: mouseY };
  let poleS = { x: mouseX + magWidth / 2 - magHeight / 2, y: mouseY };
  let numFilings = Math.round(maxDistance * 1.5);
  
  let filings = [];

  for (let i = 0; i < numFilings; i++) {
    filings.push(new Filing());
    filings[i].rotate();
  }

  /***************************/
  /*                         */
  /*        Listeners        */
  /*                         */
  /***************************/

  window.addEventListener("resize", ()=>{
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    numFilings = Math.round(maxDistance * 1.5);
  });
  
  document.addEventListener("mousemove", handleMove);
  document.addEventListener("touchmove", handleMove, {passive: false});
  document.addEventListener("click", handleClick);

  /**************************/
  /*                        */
  /*        Handlers        */
  /*                        */
  /**************************/
  function handleClick(e) {
    e.preventDefault();
    if (magnetVisible) {
      magnetVisible = false;
      for (let i = 0; i < filings.length; i++) {
        filings[i].length == 0;
        filings[i].drawingFromOrigin == true;
      }
    } else {
      magnetVisible = true;
    }
  }

  function handleMove(e) {
    e.preventDefault();
    moving = true;

    // get event x/y
    mouseX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    mouseY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    // set the pole properties
    poleN.x = mouseX - magWidth / 2 + magHeight / 2;
    poleN.y = mouseY;
    poleS.x = mouseX + magWidth / 2 - magHeight / 2;
    poleS.y = mouseY;
  }

  
  /***************************/
  /*                         */
  /*        Functions        */
  /*                         */
  /***************************/

  // draws a red and blue rectangle representing a bar magnet
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

  // draws dots at the points of attraction for each magnet pole
  function drawAttrPoints() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(poleN.x - 1, poleN.y - 1, 2, 2);
    ctx.fillRect(poleS.x - 1, poleS.y - 1, 2, 2);
  }

  /***************************/
  /*                         */
  /*        Animation        */
  /*                         */
  /***************************/
  
  // these variables will adjust each curve's movement speed to match the frame rate of the device (the time between rAF calls)
  let firstFrameTime = performance.now();
  let refreshThrottle = 1;
  let tempRefreshThrottle = 0;

  function animate(callbackTime) {
    // this locks the animation to 60fps by using the monitor's refresh rate divided by 60 to calculate per-frame movement
    tempRefreshThrottle = callbackTime - firstFrameTime;
    firstFrameTime = callbackTime;
    refreshThrottle = tempRefreshThrottle / 60;
    
    // fully clear the canvas if the bar magnet is visible. do a 60% fade if it isn't.
    if (magnetVisible) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, innerWidth, innerHeight);
    }

    for (let i = 0; i < filings.length; i++) {
      // rotate each filing
      if (moving) {
        filings[i].rotate();
      }

      // draw each filing depending on the animation state
      if (magnetVisible) {
        filings[i].drawStatic();
      } else {
        filings[i].drawDynamic(refreshThrottle);
      }
    }

    // draw the bar magnet if it's visible. otherwise, draw attraction points instead.
    if (mouseX && magnetVisible) {
      drawMagnet();
    } else {
      drawAttrPoints();
    }

    // reset the moving variable every frame
    moving = false;
    window.requestAnimationFrame(animate);
  }

  animate(0);
});