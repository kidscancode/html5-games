var game = new Phaser.Game(300,300, Phaser.AUTO, 'phaser-demo',
                           {preload: preload, create: create, update: update, render: render});

var player;
var starfield;
var cursors;
var bank;  // banking effect
var shipTrail;

var ACCEL = 800;
var DRAG = 400;
var MAXVEL = 300;

function preload() {
    game.load.image('starfield', 'img/starfield.png');
    game.load.image('ship', 'img/player.png');
    game.load.image('bullet', 'img/bullet.png');
}

function create() {
    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  The hero!
    player = game.add.sprite(150, 250, 'ship');
    player.anchor.set(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE, true);  // debug flag
    player.body.maxVelocity.set(MAXVEL, MAXVEL);
    player.body.drag.set(DRAG, DRAG);

    cursors = game.input.keyboard.createCursorKeys();
}

function update() {
    // scroll the background
    starfield.tilePosition.y += 1;

    // reset velocity and check for keys
    player.body.acceleration.x = 0;

    if (cursors.left.isDown) {
        player.body.acceleration.x = -ACCEL;
    }
    else if (cursors.right.isDown) {
        player.body.acceleration.x = ACCEL;
    };

    // stop at edges
    if (player.x > game.width - 20) {
        player.x = game.width - 20;
        player.body.acceleration.x = 0;
    };
    if (player.x < 20) {
        player.x = 20;
        player.body.acceleration.x = 0;
    };

    // apply "banking" effect
    bank = player.body.velocity.x / MAXVEL;
    player.scale.x = 1 - Math.abs(bank) / 5;
    player.angle = bank * 20;
}

function render () {

}
