var Platform = Platform || {};

Platform.Game = function () {};

Platform.Game.prototype = {
    preload: function() {
        this.game.time.advancedTiming = true;
    },

    create: function() {
        this.createLevel();
        this.createPlayer();

        this.cloud1 = this.game.add.sprite(300, 100, 'sprites', 'cloud2');

        this.cursors = this.input.keyboard.createCursorKeys();
    },

    update: function() {
        this.checkCollisions();
        this.processPlayerInput();
    },

    render: function() {
        this.game.debug.text(this.game.time.fps || '--', 20, 20, '#00ff00', '20px Courier');
        // this.game.debug.body(this.player);
    },

    checkCollisions: function() {
        this.game.physics.arcade.collide(this.player, this.blockLayer, this.playerHit, null, this);
    },

    processPlayerInput: function() {
        if (this.cursors.left.isDown) {
            this.player.body.velocity.x = -Platform.SETTINGS.PLAYER_SPEED;
            this.player.scale.x = -Platform.SETTINGS.PLAYER_SCALE;
            if (!this.player.jumping) {
                this.player.walking = true;
            }
        } else if (this.cursors.right.isDown) {
            this.player.body.velocity.x = Platform.SETTINGS.PLAYER_SPEED;
            this.player.scale.x = Platform.SETTINGS.PLAYER_SCALE;
            if (!this.player.jumping) {
                this.player.walking = true;
            }
        } else {
            this.player.body.velocity.x = 0;
            this.player.walking = false;
        }

        if (this.player.body.velocity.y > 0) {
            this.player.jumping = true;
            this.player.walking = false;
        }

        if (this.cursors.up.isDown && this.player.body.blocked.down) {
            this.player.body.velocity.y -= Platform.SETTINGS.PLAYER_JUMP;
            this.player.jumping = true;
            this.player.walking = false;
        }
        // choose animation
        // first, if not walking or running, use idle
        if (!this.player.jumping && !this.player.walking) {
            this.player.play('idle');
            return;
        }
        //if walking
        if (this.player.walking) {
            this.player.play('run');
        } else {
            // not walking, but jumping or falling
            if (this.player.body.velocity.y > 0) {
                this.player.frameName = 'jump_fall';
            } else {
                this.player.frameName = 'jump_up';
            }
        }
    },

    playerHit: function(player, blockLayer) {
        this.player.jumping = false;
    },

    createLevel: function() {
        this.map = this.game.add.tilemap('level1');
        this.map.addTilesetImage('tiles_spritesheet', 'gameTiles');
        this.blockLayer = this.map.createLayer('blockLayer');
        this.map.setCollisionBetween(1, 1000000, true, 'blockLayer');
        this.blockLayer.resizeWorld();
    },

    createPlayer: function() {
        this.player = this.game.add.sprite(100, 200, 'sprites', 'idle-frame-1');
        this.player.anchor.set(0.5, 0.5);
        this.player.scale.set(Platform.SETTINGS.PLAYER_SCALE);
        this.player.animations.add('idle', ['idle-frame-1', 'idle-frame-2'],
                                   Platform.SETTINGS.PLAYER_IDLE_FR, true, false);
        this.player.animations.add('run', ['run-frame-1', 'run-frame-2',
                                   'run-frame-3', 'run-frame-4', 'run-frame-5',
                                   'run-frame-6'], Platform.SETTINGS.PLAYER_RUN_FR,
                                   true, false);
        this.player.play('idle');
        this.player.enableBody = true;
        this.physics.enable(this.player, Phaser.Physics.ARCADE);
        // this.player.body.setSize(125, 200, 5, 3);
        this.player.body.gravity.y = 1000;
        this.game.camera.follow(this.player);
        this.player.jumping = false;
        this.player.walking = false;
    }
};
