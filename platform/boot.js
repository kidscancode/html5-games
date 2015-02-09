var Platform = Platform || {};

Platform.Boot = function () {};

Platform.Boot.prototype = {
    preload: function() {
        this.load.image('preloadbar', 'img/preloader-bar.png');
    },

    create: function() {
        this.game.stage.backgroundColor = "#fff";
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.setScreenSize(true);
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.state.start('Preload');
    }
};
