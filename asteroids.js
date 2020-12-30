const FPS = 30; // frames per second
const FRICTION = .7; // friction coefficient of space (0 = none, 1 = lots)
const GAME_LIVES = 3; // starting number of lifes
const LASER_DIST = .6; // maximum distance laser can travel as fraction of screen width
const LASER_EXPLODE_DUR = .2; // laser's explosion duration time in seconds
const LASER_MAX = 10; // maximum number of laser on screen as once
const LASER_SPD = 500; // speed of lasers in pixels per second
const ROIDS_JAG = 0.4; // jaggednes of the asteroids (0 = none, 1 = lots)
const ROIDS_PTS = 20; // Poits scored for a asteroid
const ROIDS_NUM = 1; // starting number of asteroids
const ROIDS_SIZE = 100; // starting size of asteroids in pixels
const ROIDS_SPD = 50; // max starting speed of asteroids in pixels per second
const ROIDS_VERT = 10; // average number of vertices on each asteroid
const SAVE_KEY_SCORE = 'highscore'; // save key for local storage of high score
const SHIP_BLINK_DUR = .1; // ship's blink duration time during invisibility in seconds
const SHIP_EXPLODE_DUR = .5; // ship's explosion duration time in seconds
const SHIP_INV_DUR = 3; // ship's invisibility duration time in seconds
const SHIP_SIZE = 30; // ship's height in pixels
const MUSIC_ON = true // allow the music to play
const SOUND_ON = false // allow the sounds to play
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second
const TURN_SPEED = 360; // rotation speed in degrees per second
const SHOW_BOUNDING = false; // show and hide collision bounding
const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; // text font height in pixels

/** @type {HTMLCanvasElement} */
let canva = document.getElementById('gameCanvas');
let ctx = canva.getContext('2d');

// set up sound efects
let fxLaser = new Sound('sounds/laser.m4a', 5, .5);
let fxThrust = new Sound('sounds/thrust.m4a');
let fxHit = new Sound('sounds/hit.m4a', 5);
let fxExplode = new Sound('sounds/explode.m4a');

// set up the music
let music = new Music('sounds/music-low.m4a', 'sounds/music-high.m4a');
let roidsLeft, roidsTotal;

// set up the game parameters
let level, roids, score, highScore, ship, text, textAlpha, lives;
newGame();

// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt () {
  roids = [];
  roidsTotal = (ROIDS_NUM + level) * 7;
  roidsLeft = roidsTotal;
  let x, y;
  for(var i = 0; i < ROIDS_NUM + level; i ++){
    do {
      x = Math.floor(Math.random() * canva.width);
      y = Math.floor(Math.random() * canva.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
  }
}

function destroyAsteroid(index) {
  let x = roids[index].x;
  let y = roids[index].y;
  let r = roids[index].r;

  // split asteroid in two if necessary
  if (r == Math.ceil(ROIDS_SIZE / 2)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    score += ROIDS_PTS;
  } else if (r == Math.ceil(ROIDS_SIZE / 4)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    score += ROIDS_PTS * 2.5;
  } else {
    score += ROIDS_PTS * 5;
  }

  // check high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(SAVE_KEY_SCORE, highScore);
  }

  // destroy the asteroid
  roids.splice(index, 1);
  fxHit.play();

  // calculate the ratio of remaining asteroids to determine music tempo
  roidsLeft--;
  music.setAsteroidRatio(roidsLeft == 0 ? 1 : roidsLeft / roidsTotal);

  // new level when no more asteroids
  if(roids.length == 0) {
    level ++;
    newLevel();
  }
}

function distBetweenPoints(shipX, shipY, roidX, roidY){
  return Math.sqrt(Math.pow(shipX - roidX, 2) + Math.pow(shipY - roidY, 2))
}

function drawShip(x, y, a, color = 'white') {
  ctx.strokeStyle = color;
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo( // nose of the ship
    x + 4 / 3 * ship.r * Math.cos(a),
    y - 4 / 3 * ship.r * Math.sin(a)
  );
  ctx.lineTo( // rear left
    x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
    y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo( // rear right
    x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
    y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();
  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
  fxExplode.play();
}

function gameOver() {
  ship.dead = true;
  text = 'Game Over';
  textAlpha = 1.0;
}

function keyDown (/** @type {KeyboardEvent}*/ e){
  if (ship.dead) {
    return;
  }
  switch(e.keyCode) {
    case 32: // space bar (shoot the laser)
      shootLaser();
      break;
    case 37: // left arrow (rotate ship to left)
      ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
      break;
    case 38: // up arrow (thrust the ship forward)
      ship.thrusting = true;
      break;
    case 39: // right arrow (rotate ship to right)
      ship.rot = - TURN_SPEED / 180 * Math.PI / FPS;
      break;

  }
}

function keyUp (/** @type {KeyboardEvent}*/ e){
  if (ship.dead) {
    return;
  }
  switch(e.keyCode) {
    case 32: // space bar (allow shoot)
      ship.canShoot = true;
      break;
    case 37: // left arrow (stop rotating the ship)
      ship.rot = 0;
      break;
    case 38: // up arrow (stop thrusting)
      ship.thrusting = false;
      break;
    case 39: // right arrow (rotate ship to right)
      ship.rot = 0;
      break;

  }
}

function newAsteroid(x, y, r) {
  let lvlMult = 1 + .1 * level
  let roid = {
    // x position
    x: x,
    // y position
    y: y,
    // x velocity
    xv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < .5 ? 1 : -1),
    // y velocity
    yv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < .5 ? 1 : -1),
    // size of asteroid
    r: r,
    // angle of asteroid movementation
    a: Math.random() * Math.PI * 2, // in radians
    // number of asteroid's vertices
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),

    offs: []
  };

  // create the vertex offsets array
  for (let i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG)
  }
  return roid;
}

function newGame() {
  level = 0;
  score = 0;
  lives = GAME_LIVES;
  ship = newShip();

  // get the high score from local storage
  let scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
  if (scoreStr == null) {
    highScore = 0;
  } else {
    highScore = parseInt(scoreStr);
  }
  newLevel();
}

function newLevel() {
  text = 'Level ' + (level + 1);
  textAlpha = 1.0;
  createAsteroidBelt();
}

function newShip() {
  return {
    x: canva.width / 2,
    y: canva.height / 2,
    r: SHIP_SIZE / 2,
    a: 90 / 180 * Math.PI, // convert to radians
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    canShoot: true,
    dead: false,
    explodeTime: 0,
    lasers: [],
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0
    }
  }
}

function shootLaser () {
  // create the laser object
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({ // from the nose
      x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
      y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
      xv: LASER_SPD * Math.cos(ship.a) / FPS,
      yv: -LASER_SPD * Math.sin(ship.a) / FPS,
      dist: 0,
      explodeTime: 0,
    });
    fxLaser.play();
  }
  // prevent further shooting
  ship.canShoot = false;
}

function Music(srcLow, srcHigh) {
  this.soundLow = new Audio(srcLow);
  this.soundHigh = new Audio(srcHigh);
  this.low = true;
  this.tempo = 1.0; // seconds per beat
  this.beatTime = 0; // frames left until next beat

  this.play = function() {
    if (MUSIC_ON) {
      if (this.low) {
        this.soundLow.play();
      } else {
        this.soundHigh.play();
      }
      this.low = !this.low;
    }
  }

  this.setAsteroidRatio = function(ratio) {
    this.tempo = 1.0 - .75 *  (1.0 - ratio);
  }

  this.tick = function() {
    if(this. beatTime == 0) {
      this.play();
      this.beatTime = Math.ceil(this.tempo * FPS);
    } else {
      this.beatTime--;
    }
  }
}

function Sound(src, maxStreams = 1, vol = 1.0){
  this.streamNum = 0;
  this.streams = [];

  for (let i = 0; i < maxStreams; i++) {
    this.streams.push(new Audio(src));
    this.streams[i].volume = vol;
  }

  this.play = function() {
    if (SOUND_ON) {
      this.streamNum = (this.streamNum + 1) % maxStreams;
      this.streams[this.streamNum].play()
    }
  }
  this.stop = function() {
    this.streams[this.streamNum].pause();
    this.streams[this.streamNum].currentTime = 0;
  }
}

function update () {
  let blinkOn = ship.blinkNum % 2 == 0;
  let exploding = ship.explodeTime > 0;

  // tick the music
  music.tick();

  // draw space
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canva.width, canva.height);

  // thrust the ship
  if(ship.thrusting && !ship.dead) {
    ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
    ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
    fxThrust.play();

    //draw the thruster
    if (!exploding && blinkOn) {
      ctx.fillStyle = 'red';
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = SHIP_SIZE / 10;
      ctx.beginPath();
      ctx.moveTo( // rear left
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + .5 * Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - .5 * Math.cos(ship.a))
      );
      ctx.lineTo( // rear center behind the ship
        ship.x - ship.r * 5 / 3 * Math.cos(ship.a),
        ship.y + ship.r * 5 / 3 * Math.sin(ship.a)
      );
      ctx.lineTo( // rear right
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - .5 * Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + .5 * Math.cos(ship.a))
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    

  } else {
    ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
    ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    fxThrust.stop();
  }

  // draw the triangular ship
  if (!exploding) {
    if (blinkOn && !ship.dead) {
      drawShip(ship.x, ship.y, ship.a);
    }

    // handle blinking
    if (ship.blinkNum > 0 ) {
      // reduve the blinking time
      ship.blinkTime--;

      // reduce the blink num
      if (ship.blinkTime == 0) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
        ship.blinkNum--;
      }
    }
    
  }else {
    // draw the explosion
    ctx.fillStyle = 'darkred';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false)
    ctx.fill();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false)
    ctx.fill();

    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false)
    ctx.fill();

    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * .8, 0, Math.PI * 2, false)
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * .5, 0, Math.PI * 2, false)
    ctx.fill();
  }

  // draw ship collision circle
  if (SHOW_BOUNDING) {
    ctx.strokeStyle = 'lime';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false)
    ctx.stroke();
  }

  // draw the lasers
  for (let i = 0; i < ship.lasers.length; i++) {
    if (ship.lasers[i].explodeTime == 0) {
      ctx.fillStyle = 'salmon';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
      ctx.fill();
    } else {
      // draw the explosion
      ctx.fillStyle = 'orangered';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
      ctx.fill();

      ctx.fillStyle = 'salmon';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
      ctx.fill();

      ctx.fillStyle = 'pink';
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
      ctx.fill();
    }
  }

  // draw the game text
  if(textAlpha >= 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, ' + textAlpha + ')';
    ctx.font = 'small-caps ' + TEXT_SIZE + 'px sans-serif';
    ctx.fillText(text, canva.width / 2, canva.height * .75);
    textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
  } else if (ship.dead) {
    newGame();
  }

  // draw the score
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.font = TEXT_SIZE + 'px sans-serif';
  ctx.fillText(score, canva.width - SHIP_SIZE / 2, SHIP_SIZE);

  // draw the high score
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.font = (TEXT_SIZE * .7) + 'px sans-serif';
  ctx.fillText('BEST: ' + highScore, canva.width / 2, SHIP_SIZE);

  // draw the lives
  let lifeColor;
  for (let i = 0; i < lives; i++) {
    lifeColor =( exploding && lives - 1) ? 'Red' : 'white';
    drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE * 1.2, .5 * Math.PI, lifeColor);
  }

  // detect laser hits on asteroids
  let ax, ay, ar, lx, ly;

  for (let i = roids.length - 1; i >= 0; i--) { 
    // grab the asteroid properties
    ax = roids[i].x;
    ay = roids[i].y;
    ar = roids[i].r;

    // loop over the lasers
    for (let j = ship.lasers.length - 1; j >=0 ; j--) {
      // grab the laser properties
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;

      // detect hits
      if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {

        // destroy the asteroid and activate the laser explosion
        destroyAsteroid(i);
        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS)
        
        break;

      }
    }
  }

  // draw asteroids
  let x, y, r, a, vert, offs;
  for (let i = 0; i < roids.length; i++){
    ctx.strokeStyle = 'slategray';
    ctx.lineWidth = SHIP_SIZE / 20;
    
    // get the asteroids properties
    x = roids[i].x;
    y = roids[i].y;
    r = roids[i].r;
    a = roids[i].a;
    vert = roids[i].vert;
    offs = roids[i].offs;
    // draw a path
    ctx.beginPath();
    ctx.moveTo(
      x + r * offs[0] * Math.cos(a),
      y + r * offs[0] * Math.sin(a)
    );

    // draw a poligon
    for (let j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a +j * Math.PI * 2 / vert),
        y + r * offs[j] * Math.sin(a +j * Math.PI * 2 / vert),
      )
    }
    ctx.closePath();
    ctx.stroke();

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = 'lime';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke();
    }
  }
  // check for asteroid collision (when not exploding)
  if (!exploding) {

    // only check when not blinking
    if (ship.blinkNum == 0 && !ship.dead) {
      for (let i = 0; i < roids.length; i++) {
        if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r){
          explodeShip();
          destroyAsteroid(i);
          break;
        }
      }
    }
    
  
    // rotate the ship 
    ship.a += ship.rot;

    // move the ship
  
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    ship.explodeTime--;

    // reset the ship after the explosion has finished
    if (ship.explodeTime == 0){
      lives--;
      if (lives == 0) {
        gameOver();
      } else {
        ship = newShip();
      }
      
    }
  }
  

  // handle edge of screen
  if (ship.x< 0 - ship.r) {
    ship.x = canva.width + ship.r
  } else if(ship.x > canva.width + ship.r){
    ship.x = -ship.r
  }

  if (ship.y< 0 - ship.r) {
    ship.y = canva.height + ship.r
  } else if(ship.y > canva.height + ship.r){
    ship.y = -ship.r
  }

  // move the lasers
  for (let i = 0; i < ship.lasers.length; i++) {
    // check distance travelled
    if (ship.lasers[i].dist > LASER_DIST * canva.width) {
      ship.lasers.splice(i, 1);
      continue;
    }

    // handle the explosion
    if (ship.lasers[i].explodeTime > 0) {
      ship.lasers[i].explodeTime--;

      // destroy the laiser after the duration is up
      if (ship.lasers[i].explodeTime == 0) {
        ship.lasers.splice(i, 1);
        continue;
      }
    } else {
      // move the laser
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;

      // calculate the distance travelled
      ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2))
    }

    // handle edge of screen
    if (ship.lasers[i].x < 0) {
      ship.lasers[i].x = canva.width;
    } else if(ship.lasers[i].x > canva.width){
      ship.lasers[i].x = 0
    }
  
    if (ship.lasers[i].y< 0) {
      ship.lasers[i].y = canva.height;
    } else if(ship.lasers[i].y > canva.height){
      ship.lasers[i].y = 0;
    }
  }

  // move the asteroid
  for (let i = 0; i < roids.length; i++) {
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;
  
    // handle edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canva.width + roids[i].r
    } else if (roids[i].x > canva.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r
    }

    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canva.height + roids[i].r
    } else if (roids[i].y > canva.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r
    }
  }
}
