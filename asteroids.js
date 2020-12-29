// frames per second
const FPS = 30;
// friction coefficient of space (0 = no friction and 1 = lot of friction)
const FRICTION = .7;
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

// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function keyDown(/** @type {KeyboardEvent}*/ e){
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

function keyUp(/** @type {KeyboardEvent}*/ e){
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