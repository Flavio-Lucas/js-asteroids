// frames per second
const FPS = 30;
// friction coefficient of space (0 = none, 1 = lots)
const FRICTION = .7;
// jaggednes of the asteroids (0 = none, 1 = lots)
const ROIDS_JAG = 0.5;
// starting number of asteroids
const ROIDS_NUM = 10;
// starting size of asteroids in pixels
const ROIDS_SIZE = 100;
// max starting speed of asteroids in pixels per second
const ROIDS_SPD = 50;
// average number of vertices on each asteroid
const ROIDS_VERT = 10;
// ship height in pixels
const SHIP_SIZE = 30;
// acceleration of the ship in pixels per second
const SHIP_THRUST = 5; 
// rotation speed in degrees per second
const TURN_SPEED = 360;

/** @type {HTMLCanvasElement} */
let canva = document.getElementById('gameCanvas');
let ctx = canva.getContext('2d');

// set up the spaceship object
let ship = {
  // X position
  x: canva.width / 2,
  // Y position
  y: canva.height / 2,
  //
  r: SHIP_SIZE / 2,
  // angle of the ship
  a: 90 / 180 * Math.PI, // convert to radians
  // rotation of the ship
  rot: 0,
  // 
  thrusting: false,
  thrust: {
    x: 0,
    y: 0
  }
}

//set up asteroids
let roids = [];

createAsteroidBelt();

// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt () {
  roids = [];
  let x, y;
  for(var i = 0; i < ROIDS_NUM; i ++){
    do {
      x = Math.floor(Math.random() * canva.width);
      y = Math.floor(Math.random() * canva.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y));
  }
}

function distBetweenPoints(shipX, shipY, roidX, roidY){
  return Math.sqrt(Math.pow(shipX - roidX, 2) + Math.pow(shipY - roidY, 2))
}

function keyDown (/** @type {KeyboardEvent}*/ e){
  switch(e.keyCode) {
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
  switch(e.keyCode) {
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

function newAsteroid(x, y) {
  let roid = {
    // x position
    x: x,
    // y position
    y: y,
    // x velocity
    xv: Math.random() * ROIDS_SPD / FPS * (Math.random() < .5 ? 1 : -1),
    // y velocity
    yv: Math.random() * ROIDS_SPD / FPS * (Math.random() < .5 ? 1 : -1),
    // size of asteroid
    r: ROIDS_SIZE / 2,
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

function update () {
  // draw space
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canva.width, canva.height);

  // thrust the ship
  if(ship.thrusting) {
    ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
    ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

    //draw the thruster
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

  } else {
    ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
    ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
  }

  // draw triangular ship
  ctx.strokeStyle = 'white';
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo( // nose of the ship
    ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
    ship.y - 4 / 3 * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo( // rear left
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo( // rear right
    ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();

  // draw asteroids
  ctx.strokeStyle = 'slategray';
  ctx.lineWidth = SHIP_SIZE / 20;
  let x, y, r, a, vert, offs;
  for (let i = 0; i < roids.length; i++){
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

    // move the asteroid
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

  // rotate the ship 
  ship.a += ship.rot;

  // move the ship
  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

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

  // certer dot
  // ctx.fillStyle = 'red';
  // ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
}