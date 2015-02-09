var Platform = Platform || {};

Platform.Preload = function () {};

Platform.Preload.prototype = {
    preload: function () {
        this.preloadBar = this.add.sprite(this.game.world.centerX,
                                          this.game.world.centerY,
                                          'preloadbar');
        this.preloadBar.anchor.setTo(0.5);
        this.preloadBar.scale.setTo(3);
        this.load.setPreloadSprite(this.preloadBar);

        this.load.tilemap('level1', 'img/level1.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('gameTiles', 'img/tiles_spritesheet.png');
        this.load.atlasJSONHash('sprites', 'img/platform-sprites.png', 'img/platform-sprites.json');

    },

    create: function() {
        this.state.start('Game');
    }
};
