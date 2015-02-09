
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {

  create: function () {
    this.setupBackground();
    this.setupPlayer();
    this.setupEnemies();
    this.setupBullets();
    this.setupExplosions();
    this.setupPlayerIcons();
    this.setupText();
    this.setupAudio();

    this.cursors = this.input.keyboard.createCursorKeys();
  },

  update: function () {
    this.checkCollisions();
    this.spawnEnemies();
    this.enemyFire();
    this.processPlayerInput();
    this.processDelayedEffects();
  },

  checkCollisions: function() {
    this.physics.arcade.overlap(this.bullets, this.enemies, this.enemyHit, null, this);

    this.physics.arcade.overlap(this.bullets, this.shooters, this.enemyHit, null, this);

    this.physics.arcade.overlap(this.player, this.enemies, this.playerHit, null, this);

    this.physics.arcade.overlap(this.player, this.shooters, this.playerHit, null, this);

    this.physics.arcade.overlap(this.player, this.enemyBullets, this.playerHit, null, this);

    this.physics.arcade.overlap(this.player, this.powerups, this.playerPowerup, null, this);

    if (this.bossApproaching === false) {
        this.physics.arcade.overlap(this.bullets, this.bosses, this.enemyHit, null, this);
        this.physics.arcade.overlap(this.player, this.bosses, this.playerHit, null, this);
    }
  },

  spawnBoss: function() {
    this.bossApproaching = true;
    this.boss.reset(this.game.width / 2, 0, BasicGame.BOSS_HEALTH);
    this.physics.enable(this.boss, Phaser.Physics.ARCADE);
    this.boss.body.velocity.y = BasicGame.BOSS_Y_VELOCITY;
    this.boss.play('fly');
  },

  spawnEnemies: function() {
    if (this.nextEnemyAt < this.time.now && this.enemies.countDead() > 0) {
        this.nextEnemyAt = this.time.now + this.enemyDelay;
        var enemy = this.enemies.getFirstExists(false);
        enemy.reset(this.rnd.integerInRange(20, this.game.width-20), 0, BasicGame.ENEMY_HEALTH);
        enemy.body.velocity.y = this.rnd.integerInRange(BasicGame.ENEMY_MIN_Y_VELOCITY, BasicGame.ENEMY_MAX_Y_VELOCITY);
        enemy.play('fly');
    }

    if (this.nextShooterAt < this.time.now && this.shooters.countDead() > 0) {
        this.nextShooterAt = this.time.now + this.shooterDelay;
        var shooter = this.shooters.getFirstExists(false);
        shooter.reset(this.rnd.integerInRange(20, this.game.width - 20), 0, BasicGame.SHOOTER_HEALTH);
        var target = this.rnd.integerInRange(20, this.game.width - 20);
        shooter.rotation = this.physics.arcade.moveToXY(shooter, target, this.game.height,
            this.rnd.integerInRange(BasicGame.SHOOTER_MIN_VELOCITY, BasicGame.SHOOTER_MAX_VELOCITY)) - Math.PI/2;
        shooter.play('fly');
        shooter.nextShotAt = 0;
    }
  },

  spawnPowerup: function(enemy) {
    if (this.powerups.countDead() === 0 || this.weaponLevel === 5) {
        return;
    }
    if (this.rnd.frac() < enemy.dropRate) {
        var powerup = this.powerups.getFirstExists(false);
        powerup.reset(enemy.x, enemy.y);
        powerup.body.velocity.y = BasicGame.POWERUP_VELOCITY;
    }
  },

  processPlayerInput: function() {
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;

    if (this.cursors.left.isDown) {
        this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
        this.player.body.velocity.x = this.player.speed;
    }

    if (this.cursors.up.isDown) {
        this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
        this.player.body.velocity.y = this.player.speed;
    }

    if (this.input.activePointer.isDown &&
        this.physics.arcade.distanceToPointer(this.player) > 15) {
        this.physics.arcade.moveToPointer(this.player, this.player.speed);
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.Z) ||
        this.input.activePointer.isDown) {
        if (this.returnText && this.returnText.exists) {
            this.quitGame();
        } else {
            this.fire();
        }
    }
  },

  processDelayedEffects: function() {
    if (this.instructions.exists && this.time.now > this.instExpire) {
        this.instructions.destroy();
    }

    if (this.ghostUntil && this.ghostUntil < this.time.now) {
        this.ghostUntil = null;
        this.player.play('fly');
    }

    if (this.showReturn && this.time.now > this.showReturn) {
        this.returnText = this.add.text(this.game.width/2, this.game.height/2 + 20,
            'Press Z or Tap Game to go back to Main Menu',
            { font: '16px sans-serif', fill: '#fff'}
        );
        this.returnText.anchor.setTo(0.5, 0.5);
        this.showReturn = false;
    }

    if (this.bossApproaching && this.boss.y > 80) {
        this.bossApproaching = false;
        this.boss.nextShotAt = 0;
        this.boss.body.velocity.y = 0;
        this.boss.body.velocity.x = BasicGame.BOSS_X_VELOCITY;
        this.boss.body.bounce.x = 1;
        this.boss.body.collideWorldBounds = true;
    }
  },

  render: function() {
    // this.game.debug.body(this.player);
  },

  setupBackground: function() {
    this.sea = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'sea');
    this.sea.autoScroll(0, BasicGame.SEA_SCROLL_SPEED);
  },

  setupAudio: function() {
    this.explosionSFX = this.add.audio('explosion');
    this.playerExplosionSFX = this.add.audio('playerExplosion');
    this.enemyFireSFX = this.add.audio('enemyFire');
    this.playerFireSFX = this.add.audio('playerFire');
    this.powerupSFX = this.add.audio('powerup');
  },

  setupPlayer: function() {
    this.player = this.add.sprite(this.game.width/2, this.game.height-50, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.player.animations.add('fly', [0, 1, 2], 20, true);
    this.player.animations.add('ghost', [3, 0, 3, 1], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.speed = BasicGame.PLAYER_SPEED;
    this.player.body.collideWorldBounds = true;
    this.player.body.setSize(20, 20, 0, -5);
    this.weaponLevel = 0;
  },

  setupEnemies: function() {
    this.enemies = this.add.group();
    this.enemies.enableBody = true;
    this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemies.createMultiple(50, 'greenEnemy');
    this.enemies.setAll('anchor.x', 0.5);
    this.enemies.setAll('anchor.y', 0.5);
    this.enemies.setAll('outOfBoundsKill', true);
    this.enemies.setAll('checkWorldBounds', true);
    this.enemies.setAll('reward', BasicGame.ENEMY_REWARD, false, false, 0, true);
    this.enemies.setAll('dropRate', BasicGame.ENEMY_DROP_RATE, false, false, 0, true);
    this.enemies.forEach(function (enemy) {
        enemy.animations.add('fly', [0, 1, 2], 20, true);
        enemy.animations.add('hit', [3, 1, 3, 2], 20, false);
        enemy.events.onAnimationComplete.add( function(e) {
            e.play('fly');
        }, this);
    });
    this.nextEnemyAt = 0;
    this.enemyDelay = BasicGame.SPAWN_ENEMY_DELAY;

    this.shooters = this.add.group();
    this.shooters.enableBody = true;
    this.shooters.physicsBodyType = Phaser.Physics.ARCADE;
    this.shooters.createMultiple(50, 'whiteEnemy');
    this.shooters.setAll('anchor.x', 0.5);
    this.shooters.setAll('anchor.y', 0.5);
    this.shooters.setAll('outOfBoundsKill', true);
    this.shooters.setAll('checkWorldBounds', true);
    this.shooters.setAll('reward', BasicGame.SHOOTER_REWARD, false, false, 0, true);
    this.shooters.setAll('dropRate', BasicGame.SHOOTER_DROP_RATE, false, false, 0, true);
    this.shooters.forEach(function (enemy) {
        enemy.animations.add('fly', [0, 1, 2], 20, true);
        enemy.animations.add('hit', [3, 1, 3, 2], 20, false);
        enemy.events.onAnimationComplete.add( function(e) {
            e.play('fly');
        }, this);
    });

    this.nextShooterAt = this.time.now + Phaser.Timer.SECOND * 5;
    this.shooterDelay = BasicGame.SPAWN_SHOOTER_DELAY;

    this.bosses = this.add.group();
    this.bosses.enableBody = true;
    this.bosses.physicsBodyType = Phaser.Physics.ARCADE;
    this.bosses.createMultiple(1, 'boss');
    this.bosses.setAll('anchor.x', 0.5);
    this.bosses.setAll('anchor.y', 0.5);
    this.bosses.setAll('outOfBoundsKill', true);
    this.bosses.setAll('checkWorldBounds', true);
    this.bosses.setAll('reward', BasicGame.BOSS_REWARD, false, false, 0, true);
    this.bosses.setAll('dropRate', BasicGame.BOSS_DROP_RATE, false, false, 0, true);
    this.bosses.forEach(function (enemy) {
        enemy.animations.add('fly', [0, 1, 2], 20, true);
        enemy.animations.add('hit', [3, 1, 3, 2], 20, false);
        enemy.events.onAnimationComplete.add( function(e) {
            e.play('fly');
        }, this);
    });
    this.boss = this.bosses.getTop();
    this.bossApproaching = false;
  },

  setupBullets: function() {
    this.enemyBullets = this.add.group();
    this.enemyBullets.enableBody = true;
    this.enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBullets.createMultiple(100, 'enemyBullet');
    this.enemyBullets.setAll('anchor.x', 0.5);
    this.enemyBullets.setAll('anchor.y', 0.5);
    this.enemyBullets.setAll('outOfBoundsKill', true);
    this.enemyBullets.setAll('checkWorldBounds', true);
    this.enemyBullets.setAll('reward', 0, false, false, 0, true);

    this.bullets = this.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(100, 'bullet');
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);

    this.nextShotAt = 0;
    this.shotDelay = BasicGame.SHOT_DELAY;
  },

  setupExplosions: function() {
    this.explosions = this.add.group();
    this.explosions.enableBody = true;
    this.explosions.physicsBodyType = Phaser.Physics.ARCADE;
    this.explosions.createMultiple(100, 'explosion');
    this.explosions.setAll('anchor.x', 0.5);
    this.explosions.setAll('anchor.y', 0.5);
    this.explosions.forEach(function (explosion) {
        explosion.animations.add('boom');
    });
  },

  setupPlayerIcons: function() {
    this.powerups = this.add.group();
    this.powerups.enableBody = true;
    this.powerups.physicsBodyType = Phaser.Physics.ARCADE;
    this.powerups.createMultiple(5, 'powerup1');
    this.powerups.setAll('anchor.x', 0.5);
    this.powerups.setAll('anchor.y', 0.5);
    this.powerups.setAll('outOfBoundsKill', true);
    this.powerups.setAll('checkWorldBounds', true);
    this.powerups.setAll('reward', BasicGame.POWERUP_REWARD, false, false, 0, true);

    this.lives = this.add.group();
    var firstLiveIconX = this.game.width - 10 - (BasicGame.PLAYER_EXTRA_LIVES * 30);
    for (var i = 0; i < BasicGame.PLAYER_EXTRA_LIVES; i++) {
        var life = this.lives.create(firstLiveIconX + (30 * i), 30, 'player');
        life.scale.setTo(0.5, 0.5);
        life.anchor.setTo(0.5, 0.5);
    }
  },

  setupText: function() {
    this.instructions = this.add.text(this.game.width/2, this.game.height-100,
        'Use Arrow Keys to Move, Press Z to Fire\n' +
        'Tapping/clicking does both',
        { font: '20px monospace', fill: '#fff', align: 'center' }
    );
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + BasicGame.INSTRUCTION_EXPIRE;

    this.score = 0;
    this.scoreText = this.add.text(this.game.width/2, 30,
        '' + this.score, { font: '20px monospace', fill: '#fff', align: 'center'}
    );
    this.scoreText.anchor.setTo(0.5, 0.5);
  },

  enemyHit: function (bullet, enemy) {
      bullet.kill();
      this.damageEnemy(enemy, BasicGame.BULLET_DAMAGE);
  },

  playerHit: function (player, enemy) {
    if (this.ghostUntil && this.ghostUntil > this.time.now) {
        return;
    }
    this.playerExplosionSFX.play();
    this.damageEnemy(enemy, BasicGame.CRASH_DAMAGE);
    var life = this.lives.getFirstAlive();
    if (life !== null) {
        life.kill();
        this.weaponLevel = 0;
        this.ghostUntil = this.time.now + BasicGame.PLAYER_GHOST_TIME;
        this.player.play('ghost');
    } else {
        this.explode(player);
        player.kill();
        this.displayEnd(false);
    }
  },

  enemyFire: function() {
    this.shooters.forEachAlive(function (enemy) {
        if (this.time.now > enemy.nextShotAt && this.enemyBullets.countDead() > 0) {
            var bullet = this.enemyBullets.getFirstExists(false);
            bullet.reset(enemy.x, enemy.y);
            this.physics.arcade.moveToObject(bullet, this.player, BasicGame.ENEMY_BULLET_VELOCITY);
            enemy.nextShotAt = this.time.now + BasicGame.SHOOTER_SHOT_DELAY;
            this.enemyFireSFX.play();
        }
    }, this);

    if (this.bossApproaching === false && this.boss.alive && this.boss.nextShotAt < this.time.now && this.enemyBullets.countDead() >= 10) {
        this.boss.nextShotAt = this.time.now + BasicGame.BOSS_SHOT_DELAY;
        this.enemyFireSFX.play();

        for (var i = 0; i < 5; i++) {
            var leftBullet = this.enemyBullets.getFirstExists(false);
            leftBullet.reset(this.boss.x - 10 - i * 10, this.boss.y + 20);
            var rightBullet = this.enemyBullets.getFirstExists(false);
            rightBullet.reset(this.boss.x + 10 + i * 10, this.boss.y + 20);

            if (this.boss.health > BasicGame.BOSS_HEALTH / 2) {
                this.physics.arcade.moveToObject(leftBullet, this.player, BasicGame.ENEMY_BULLET_VELOCITY);
                this.physics.arcade.moveToObject(rightBullet, this.player, BasicGame.ENEMY_BULLET_VELOCITY);
            } else {
                this.physics.arcade.moveToXY(leftBullet, this.player.x - i * 100, this.player.y, BasicGame.ENEMY_BULLET_VELOCITY);
                this.physics.arcade.moveToXY(rightBullet, this.player.x + i * 100, this.player.y, BasicGame.ENEMY_BULLET_VELOCITY);
            }
        }
    }
  },

  fire: function() {
    if (!this.player.alive || this.nextShotAt > this.time.now) {
        return;
    }

    this.nextShotAt = this.time.now + this.shotDelay;
    this.playerFireSFX.play();

    var bullet;
    if (this.weaponLevel === 0) {
        if (this.bullets.countDead() === 0) {
            return;
        }
        bullet = this.bullets.getFirstExists(false);
        bullet.reset(this.player.x, this.player.y - 20);
        bullet.body.velocity.y = -BasicGame.BULLET_VELOCITY;
    } else {
        if (this.bullets.countDead() < this.weaponLevel * 2) {
            return;
        }
        for (var i = 0; i < this.weaponLevel; i++) {
            bullet = this.bullets.getFirstExists(false);
            bullet.reset(this.player.x - (10 + i * 6), this.player.y - 20);
            this.physics.arcade.velocityFromAngle(-95 - i * 10, BasicGame.BULLET_VELOCITY, bullet.body.velocity);

            bullet = this.bullets.getFirstExists(false);
            bullet.reset(this.player.x + (10 + i * 6), this.player.y - 20);
            this.physics.arcade.velocityFromAngle(-85 + i * 10, BasicGame.BULLET_VELOCITY, bullet.body.velocity);
        }
    }
  },

  explode: function (sprite) {
    if (this.explosions.countDead() === 0) {
        return;
    }
    var explosion = this.explosions.getFirstExists(false);
    explosion.reset(sprite.x, sprite.y);
    explosion.play('boom', 15, false, true);
    explosion.body.velocity.x = sprite.body.velocity.x;
    explosion.body.velocity.y = sprite.body.velocity.y;
  },

  playerPowerup: function(player, powerup) {
    this.addToScore(powerup.reward);
    powerup.kill();
    this.powerupSFX.play();
    if (this.weaponLevel < 5) {
        this.weaponLevel++;
    }
  },

  damageEnemy: function(enemy, damage) {
    enemy.damage(damage);
    if (enemy.alive) {
        enemy.play('hit');
    } else {
        this.explode(enemy);
        this.explosionSFX.play();
        this.spawnPowerup(enemy);
        this.addToScore(enemy.reward);
        if (enemy.key === 'boss') {
            this.enemies.destroy();
            this.shooters.destroy();
            this.bosses.destroy();
            this.enemyBullets.destroy();
            this.displayEnd(true);
        }
    }
  },

  addToScore: function(score) {
    this.score += score;
    this.scoreText.text = this.score;
    if (this.score >= 20000 && this.bosses.countDead() == 1) {
        this.spawnBoss();
    }
  },

  displayEnd: function(win) {
    if (this.endText && this.endText.exists) {
        return;
    }
    var msg = win ? 'You Win!!!' : 'Game Over!';
    this.endText = this.add.text(this.game.width/2, this.game.height/2 - 60,
        msg, { font: '72px serif', fill: '#fff'}
        );
    this.endText.anchor.setTo(0.5, 0.5);

    this.showReturn = this.time.now + BasicGame.RETURN_MESSAGE_DELAY;
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.
    this.sea.destroy();
    this.player.destroy();
    this.enemies.destroy();
    this.shooters.destroy();
    this.enemyBullets.destroy();
    this.powerups.destroy();
    this.bosses.destroy();
    this.bullets.destroy();
    this.explosions.destroy();
    this.instructions.destroy();
    this.scoreText.destroy();
    this.endText.destroy();
    this.returnText.destroy();
    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  }

};
