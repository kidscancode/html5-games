var Platform = Platform || {};

Platform.SETTINGS = {
    PLAYER_SCALE: 0.35,
    PLAYER_SPEED: 300,
    PLAYER_IDLE_FR: 2,
    PLAYER_RUN_FR: 10,
    PLAYER_JUMP: 700
};

Platform.game = new Phaser.Game(746, 420, Phaser.AUTO, '');
Platform.game.state.add('Boot', Platform.Boot);
Platform.game.state.add('Preload', Platform.Preload);
Platform.game.state.add('Game', Platform.Game);
Platform.game.state.start('Boot');
