var game = new Phaser.Game(600, 400, Phaser.AUTO, 'phaser-demo', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

var player;
var starfield;
var cursors;
var bank; // banking effect
var shipTrail;
var bullets;
var enemyBullets;
var explosions;
var greenEnemies;
var greenEnemySpacing = 1000;
var greenEnemyLaunchTimer;
var blueEnemies;
var blueEnemyLaunchTimer;
var blueEnemyLaunched = false;
var gameOver;
var fireButton;
var shields;
var score = 0;
var scoreText;
var bulletTimer = 0;

var ACCEL = 800;
var DRAG = 400;
var MAXVEL = 300;
var MIN_ENEMY_SPACING = 300;
var MAX_ENEMY_SPACING = 3000;
var ENEMY_SPEED = 300;

function preload() {
    game.load.image('starfield', 'img/starfield.png');
    game.load.image('ship', 'img/player.png');
    game.load.image('bullet', 'img/bullet.png');
    game.load.image('enemy-green', 'img/enemy-green.png');
    game.load.image('enemy-blue', 'img/enemy-blue.png');
    game.load.image('blueEnemyBullet', 'img/enemy-blue-bullet.png');
    game.load.spritesheet('explosion', 'img/explode.png', 128, 128);
}

function create() {
    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    // bullet group
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(50, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    //  The hero!
    player = game.add.sprite(300, 350, 'ship');
    player.health = 100;
    player.anchor.set(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE, true); // debug flag
    player.body.maxVelocity.set(MAXVEL, MAXVEL);
    player.body.drag.set(DRAG, DRAG);
    player.weaponLevel = 1;
    player.events.onKilled.add(function () {
        shipTrail.kill();
    });
    player.events.onRevived.add(function () {
        shipTrail.start(false, 5000, 10);
    });

    // enemies
    greenEnemies = game.add.group();
    greenEnemies.enableBody = true;
    greenEnemies.physicsBodyType = Phaser.Physics.ARCADE;
    greenEnemies.createMultiple(5, 'enemy-green');
    greenEnemies.setAll('anchor.x', 0.5);
    greenEnemies.setAll('anchor.y', 0.5);
    greenEnemies.setAll('scale.x', 0.4);
    greenEnemies.setAll('scale.y', 0.4);
    // greenEnemies.setAll('outOfBoundsKill', true);
    // greenEnemies.setAll('checkWorldBounds', true);
    greenEnemies.forEach(function (enemy) {
        addEnemyEmitterTrail(enemy);
        enemy.body.setSize(enemy.width * 3 / 4, enemy.height * 3 / 4);
        enemy.damageAmount = 20;
        enemy.events.onKilled.add(function () {
            enemy.trail.kill();
        });
    });

    game.time.events.add(1000, launchGreenEnemy);

    blueEnemies = game.add.group();
    blueEnemies.enableBody = true;
    blueEnemies.physicsBodyType = Phaser.Physics.ARCADE;
    blueEnemies.createMultiple(30, 'enemy-blue');
    blueEnemies.setAll('anchor.x', 0.5);
    blueEnemies.setAll('anchor.y', 0.5);
    blueEnemies.setAll('scale.x', 0.5);
    blueEnemies.setAll('scale.y', 0.5);
    blueEnemies.setAll('angle', 180);
    blueEnemies.forEach(function(enemy) {
        enemy.damageAmount = 40;
    });

    // game.time.events.add(1000, launchBlueEnemy);

    //  Blue enemy's bullets
    blueEnemyBullets = game.add.group();
    blueEnemyBullets.enableBody = true;
    blueEnemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    blueEnemyBullets.createMultiple(30, 'blueEnemyBullet');
    blueEnemyBullets.callAll('crop', null, {x: 90, y: 0, width: 90, height: 70});
    blueEnemyBullets.setAll('alpha', 0.9);
    blueEnemyBullets.setAll('anchor.x', 0.5);
    blueEnemyBullets.setAll('anchor.y', 0.5);
    blueEnemyBullets.setAll('outOfBoundsKill', true);
    blueEnemyBullets.setAll('checkWorldBounds', true);
    blueEnemyBullets.forEach(function(enemy){
        enemy.body.setSize(20, 20);
    });
    // controls
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // ship trail emitter
    shipTrail = game.add.emitter(player.x, player.y + 10, 400);
    shipTrail.width = 10;
    shipTrail.makeParticles('bullet');
    shipTrail.setXSpeed(30, -30);
    shipTrail.setYSpeed(200, 180);
    shipTrail.setRotation(50, -50);
    shipTrail.setAlpha(1, 0.01, 800);
    shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000, Phaser.Easing.Quintic.Out);
    shipTrail.start(false, 5000, 10);

    // explosion pool
    explosions = game.add.group();
    explosions.enableBody = true;
    explosions.physicsBodyType = Phaser.Physics.ARCADE;
    explosions.createMultiple(30, 'explosion');
    explosions.setAll('anchor.x', 0.5);
    explosions.setAll('anchor.y', 0.5);
    explosions.forEach(function (explosion) {
        explosion.animations.add('explosion');
    });

    // display health
    shields = game.add.text(game.world.width - 150, 10, 'Shields: ' + player.health + '%', {
        font: '20px Arial',
        fill: '#fff'
    });
    shields.render = function () {
        shields.text = 'Shields: ' + Math.max(player.health, 0) + '%';
    };

    // display score
    scoreText = game.add.text(10, 10, '', { font: '20px Arial', fill: '#fff' });
    scoreText.render = function () {
        scoreText.text = 'Score: ' + score;
    };
    scoreText.render();

    // Game over text
    gameOver = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER!', {
        font: '84px Arial',
        fill: '#fff'
    });
    gameOver.anchor.setTo(0.5, 0.5);
    gameOver.visible = false;
}

function update() {
    // scroll the background
    starfield.tilePosition.y += 1;

    // reset velocity and check for keys
    player.body.acceleration.x = 0;

    if (cursors.left.isDown) {
        player.body.acceleration.x = -ACCEL;
    } else if (cursors.right.isDown) {
        player.body.acceleration.x = ACCEL;
    }

    // stop at edges
    if (player.x > game.width - 20) {
        player.x = game.width - 20;
        player.body.acceleration.x = 0;
    }
    if (player.x < 20) {
        player.x = 20;
        player.body.acceleration.x = 0;
    }

    // fire
    if (player.alive && (fireButton.isDown || game.input.activePointer.isDown)) {
        fireBullet();
    }

    // move toward mouse
    if (game.input.x < game.width - 20 &&
        game.input.x > 20 &&
        game.input.y > 20 &&
        game.input.y < game.height - 20) {
        var minDist = 200;
        var dist = game.input.x - player.x;
        player.body.velocity.x = MAXVEL * game.math.clamp(dist / minDist, -1, 1);
    }

    // apply "banking" effect
    bank = player.body.velocity.x / MAXVEL;
    player.scale.x = 1 - Math.abs(bank) / 5;
    player.angle = bank * 20;

    // shift the particle trail
    shipTrail.x = player.x;

    // collisions
    game.physics.arcade.overlap(player, greenEnemies, shipCollide, null);
    game.physics.arcade.overlap(greenEnemies, bullets, hitEnemy, null);
    game.physics.arcade.overlap(player, blueEnemies, shipCollide, null);
    game.physics.arcade.overlap(blueEnemies, bullets, hitEnemy, null);
    game.physics.arcade.overlap(blueEnemyBullets, player, enemyHitsPlayer, null);

    // check for game over
    if (!player.alive && gameOver.visible === false) {
        gameOver.visible = true;
        gameOver.alpha = 0;
        var fadeInGameOver = game.add.tween(gameOver);
        fadeInGameOver.to({alpha: 1}, 1000, Phaser.Easing.Quintic.Out);
        fadeInGameOver.onComplete.add(setResetHandlers);
        fadeInGameOver.start();

        function setResetHandlers() {
            // show "click to restart"
            tapRestart = game.input.onTap.addOnce(_restart, this);
            spaceRestart = fireButton.onDown.addOnce(_restart, this);

            function _restart() {
                tapRestart.detach();
                spaceRestart.detach();
                restart();
            }
        }
    }
}

function fireBullet() {
    if (game.time.now > bulletTimer) {
        var BULLET_SPEED = 400;
        var BULLET_SPACING = 250;
        // grab a bullet from the pool
        var bullet = bullets.getFirstExists(false);
        if (bullet) {
            var bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
            bullet.reset(player.x + bulletOffset, player.y);
            bullet.angle = player.angle;
            game.physics.arcade.velocityFromAngle(bullet.angle - 90, BULLET_SPEED, bullet.body.velocity);
            bullet.body.velocity.x += player.body.velocity.x;

            bulletTimer = game.time.now + BULLET_SPACING;
        }
    }
}

function launchGreenEnemy() {
    // var MIN_ENEMY_SPACING = 300;
    // var MAX_ENEMY_SPACING = 3000;
    var ENEMY_SPEED = 300;

    var enemy = greenEnemies.getFirstExists(false);
    if (enemy) {
        enemy.reset(game.rnd.integerInRange(0, game.width), -20);
        enemy.body.velocity.x = game.rnd.integerInRange(-300, 300);
        enemy.body.velocity.y = ENEMY_SPEED;
        enemy.body.drag.x = 100;
        enemy.trail.start(false, 800, 1);

        // face in dir of motion
        enemy.update = function () {
            enemy.angle = 180 - game.math.radToDeg(Math.atan2(enemy.body.velocity.x, enemy.body.velocity.y));

            enemy.trail.x = enemy.x;
            enemy.trail.y = enemy.y - 10;

            // kill if offscreen
            if (enemy.y > game.height + 200) {
                enemy.kill();
            }
        };
    }

    // timer to launch more enemies
    // game.time.events.add(game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING), launchGreenEnemy);
    // greenEnemyLaunchTimer = game.time.events.add(game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING), launchGreenEnemy);
    greenEnemyLaunchTimer = game.time.events.add(game.rnd.integerInRange(greenEnemySpacing, greenEnemySpacing + 1000), launchGreenEnemy);
}

function launchBlueEnemy () {
    var startingX = game.rnd.integerInRange(100, game.width-100);
    var verticalSpeed = 180;
    var spread = 60;
    var frequency = 70;
    var verticalSpacing = 70;
    var numEnemiesInWave = 5;
    var timeBetweenWaves = 2500;

    // launch wave
    for (var i = 0; i < numEnemiesInWave; i++) {
        var enemy = blueEnemies.getFirstExists(false);
        if (enemy) {
            enemy.startingX = startingX;
            enemy.reset(game.width/2, -verticalSpacing * i);
            enemy.body.velocity.y = verticalSpeed;
            var bulletSpeed = 400;
            var firingDelay = 2000;
            enemy.bullets = 1;
            enemy.lastShot = 0;

            // update function for each enemy
            enemy.update = function() {
                // wave movement
                this.body.x = this.startingX + Math.sin((this.y) / frequency) * spread;
                // squish and rotate for "banking" effect
                bank = Math.cos((this.y + 60) / frequency);
                this.scale.x = 0.5 - Math.abs(bank) / 8;
                this.angle = 180 - bank * 2;
                //fire
                enemyBullet = blueEnemyBullets.getFirstExists(false);
                if (enemyBullet && this.alive && this.bullets && this.y > game.width / 8 && game.time.now > firingDelay + this.lastShot) {
                    this.lastShot = game.time.now;
                    this.bullets--;
                    enemyBullet.reset(this.x, this.y + this.height/2);
                    enemyBullet.damageAmount = this.damageAmount;
                    var angle = game.physics.arcade.moveToObject(enemyBullet, player, bulletSpeed);
                    enemyBullet.angle = game.math.radToDeg(angle);
                }
                // kill offscreen
                if (this.y > game.height + 200) {
                    this.kill();
                }
            };
        }
    }

    // send another wave w/delay
    // blueEnemyLaunchTimer = game.time.events.add(timeBetweenWaves, launchBlueEnemy);
    blueEnemyLaunchTimer = game.time.events.add(game.rnd.integerInRange(timeBetweenWaves, timeBetweenWaves + 4000), launchBlueEnemy);
}
function addEnemyEmitterTrail(enemy) {
    var enemyTrail = game.add.emitter(enemy.x, player.y - 10, 100);
    enemyTrail.width = 10;
    enemyTrail.makeParticles('explosion', [1, 2, 3, 4, 5]);
    enemyTrail.setXSpeed(20, -20);
    enemyTrail.setRotation(50, -50);
    enemyTrail.setAlpha(0.4, 0, 800);
    enemyTrail.setScale(0.01, 0.1, 0.01, 0.1, 1000, Phaser.Easing.Quintic.Out);
    enemy.trail = enemyTrail;
}

function shipCollide(player, enemy) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(enemy.body.x + enemy.body.halfWidth, enemy.body.y + enemy.body.halfHeight);
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    enemy.kill();

    player.damage(enemy.damageAmount);
    shields.render();
}

function hitEnemy(enemy, bullet) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(bullet.body.x + bullet.body.halfWidth, bullet.body.y + bullet.body.halfHeight);
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    enemy.kill();
    bullet.kill();
    score += enemy.damageAmount * 10;
    scoreText.render();

    // increase pace as score increases
    greenEnemySpacing *= 0.9;
    if (!blueEnemyLaunched && score > 1000) {
        blueEnemyLaunched = true;
        launchBlueEnemy();
        greenEnemySpacing *= 2;
    }
}

function enemyHitsPlayer (player, bullet) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x + player.body.halfWidth, player.body.y + player.body.halfHeight);
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    bullet.kill();

    player.damage(bullet.damageAmount);
    shields.render();
}

function restart () {
    // reset enemies
    greenEnemies.callAll('kill');
    game.time.events.remove(greenEnemyLaunchTimer);
    game.time.events.add(1000, launchGreenEnemy);
    blueEnemies.callAll('kill');
    game.time.events.remove(blueEnemyLaunchTimer);
    // game.time.events.add(1000, launchBlueEnemy);
    blueEnemyBullets.callAll('kill');

    // revive player
    player.revive();
    player.health = 100;
    shields.render();
    score = 0;
    scoreText.render();

    // hide GO text
    gameOver.visible = false;

    // reset pacing
    greenEnemySpacing = 1000;
    blueEnemyLaunched = false;
}

function render() {
    // debug hitboxes
    // for (var i = 0; i < greenEnemies.length; i++) {
    //     game.debug.body(greenEnemies.children[i]);
    // }
    // game.debug.body(player);
}
