/* jshint browser:true */
// create BasicGame Class
Firefly = function(game, id, pngId, ringPngId)
{
    Phaser.Sprite.call(this, game,  game.world.randomX, game.world.randomY, pngId);
    this.id = id;
    this.anchor.setTo(0.5, 0.5);
    
    this.game = game;
    this.checkWorldBounds = true;
    //this.outOfBoundsKill = true;
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.exists = true;
    game.add.existing(this);
    this.scale.setTo(0.3, 0.3);
  
    this.body.collideWorldBounds = true;
    this.body.bounce.setTo(1, 1);
    
    this.initializeRing(game, ringPngId);
    
    // GH: Initialize input Data
    this.inputEnabled = true;
    
    this.startFade = false;
    this.fadeTimeMax = 0.4;
    this.fadeTimer = 0;
    this.events.onInputDown.add(this.onTouchEnd, this);
    
    // GH: velocity shenaningans
    this.body.angularVelocity = 200;
};

Firefly.prototype = Object.create(Phaser.Sprite.prototype);
Firefly.prototype.constructor = Firefly;

Firefly.prototype.initializeRing = function(game, ringPngId)
{
    this.ring = game.add.sprite(this.x, this.y, ringPngId);
    game.physics.enable(this.ring, Phaser.Physics.ARCADE);
    this.ring.anchor.setTo(0.5, 0.5);
    this.ring.scale.setTo(0.3, 0.3);
    this.ring.scaleMax = 1.5;
    this.ring.scaleMin = 0.25;
    this.scaleDirection = 1;
    
    // GH : Random initializers for the ring variables
    this.randomCount = 0;
    this.randomSpeed = .25;
    
    this.readyForTap = false;
    this.shakeTimerMax = 3;
    this.shakeTimer = 0;
    this.shakeDirection = 5;
    this.shakeSkipMax = 0.04;
    this.shakeSkip = 0;
    
    this.randomAngularVelocity = 300;
    this.startAngularVelocity();
    
    this.maxChangeMovementTimer = 3;
    this.currentChangeMovementTimer = this.maxChangeMovementTimer * game.rnd.frac();
    this.movementCounter = 0;
}

Firefly.prototype.onTouchEnd = function()
{
    if(this.readyForTap)
    {
        this.startFade = true;
    }
}

Firefly.prototype.update = function()
{
    // GH: If ready for tap, the ring doesn't move, neither the firefly
    if(this.readyForTap == false)
    {
        // GH: randomly switch the ring scaling direction
        if(this.randomCount > 40)
        {
            // GH: Reset, then give me new speeds
            this.scaleDirection *= -1;
            this.randomCount = 0;
            this.randomSpeed = this.game.rnd.frac();
        }

        this.randomCount += this.game.rnd.frac();
        // GH: add the random speeds
        scaleX = this.ring.scale.x + this.randomSpeed * this.game.time.physicsElapsed * this.scaleDirection;
        scaleY = this.ring.scale.y + this.randomSpeed * this.game.time.physicsElapsed * this.scaleDirection;

        // GH: If we get in a boundary, reset
        if(scaleX <= this.ring.scaleMin || scaleX >= this.ring.scaleMax )
        {
            scaleY = scaleX = scaleX <= this.ring.scaleMin ? this.ring.scaleMin : this.ring.scaleMax;
            this.scaleDirection *= -1;
            this.randomSpeed = this.game.rnd.frac();
            this.randomCount = 0;
        }

        this.ring.scale.setTo(scaleX, scaleY);
        this.readyForTap = scaleX < 0.3 ? true : false;
        
        // GH: Check if we need to change the movement
        if(this.movementCounter >= this.currentChangeMovementTimer)
        {
            this.currentChangeMovementTimer = this.maxChangeMovementTimer * this.game.rnd.frac();
            this.movementCounter = 0;
            this.startAngularVelocity();
        }
        this.movementCounter += this.game.time.physicsElapsed;
        
        this.game.physics.arcade.velocityFromAngle(this.angle, this.randomAngularVelocity, this.body.velocity);
    }
    
    // GH: Start shaking the firefly to signal TAPABILITY
    if(this.readyForTap)
    {
        this.shake(this.game.time.physicsElapsed);
        this.body.angularVelocity = 0;
        this.body.velocity.setTo(0, 0 );
    }
 
    
    // GH: Start to fade when the user taps
    if(this.startFade)
    {
        if(this.fadeTimeMax <= this.fadeTimer && this.alpha <= 0)
        {
            this.exists = false;
            this.game.comboScreen.checkSequence(this.id);
            this.game.checkAlive();
            
            return;
        }
        console.log("FADE");
        this.fadeTimer += this.game.time.physicsElapsed;
        this.alpha -=  this.game.time.physicsElapsed;
        this.ring.alpha -= this.game.time.physicsElapsed;
        this.body.angularVelocity = 0;
        this.body.velocity.setTo(0, 0 );
    }
  
    // GH: Force the ring to mimic the position
    this.ring.position.x = this.position.x;
    this.ring.position.y = this.position.y;    
};


Firefly.prototype.startAngularVelocity = function()
{
    randDir = this.game.rnd.frac() > 0.5 ? -1 : 1;
    this.body.angularVelocity = this.game.rnd.frac() * 200 * randDir ;
    
    this.randomAngularVelocity = 300 * this.game.rnd.frac();
}

// GH: shake the firefly
Firefly.prototype.shake = function(delta)
{
    // GH: Maxed out on the shake timer, reset everything
    if(this.shakeTimer >= this.shakeTimerMax)
    {
        this.shakeTimer = 0;
        this.readyForTap = false;
        this.ring.scale.setTo(.31, .31);
        this.scaleDirection = 1;
        this.randomSpeed = this.game.rnd.frac();
        this.randomCount = 0;
        this.startAngularVelocity();
        return;
    }
    this.shakeTimer += delta;
    // GH: Shake skip to portray a better effect
    if(this.shakeSkip >= this.shakeSkipMax)
    {
        this.position.x += this.shakeDirection ;
        this.shakeDirection *= -1;
        this.shakeSkip = 0;
    }
    this.shakeSkip += delta;
    
};

ComboScreen = {};

ComboScreen = function(game)
{
    Phaser.Group.call(this,  game, game.world, 'ComboScreen', false, true, Phaser.Physics.ARCADE);
    
    this.circles = [];
    this.circlesId = [];
    this.game = game;
    game.add.existing(this);
};

ComboScreen.prototype = Object.create(Phaser.Group.prototype);
ComboScreen.prototype.constructor = ComboScreen;


ComboScreen.prototype.checkSequence = function(id)
{
    
    console.log("trying to destroy id: " + id );
    console.log("currentIds: " + this.circlesId);
    if(this.circlesId[0] == id)
    {
        this.circlesId.splice(0, 1);
        this.circles[0].destroy();
        this.circles.splice(0, 1);
    }
};

ComboScreen.prototype.createSequence = function()
{
    
    if(this.circles.length != 0)
    {
        return;
    }
    
    maxSequence = this.game.rnd.integerInRange(1,3);
    for(i = 0; i < maxSequence ; i++)
    {
        id = this.game.rnd.integerInRange(0, 2);

        spr = {};
        switch(id)
        {
            case 0:
                spr = this.game.add.sprite(200 + i * 50, this.game.world.height - 20, 'red_firefly');
                break;
            case 1:
                spr = this.game.add.sprite(200 + i * 50, this.game.world.height - 20, 'blue_firefly');
                break;
            case 2:
                spr = this.game.add.sprite(200 + i * 50, this.game.world.height - 20, 'orange_firefly');    
                break;
        }

        spr.scale.set(0.1, 0.1);
        this.circles.push(spr);
        this.circlesId.push(id);        
    }

};


ComboScreen.prototype.update = function()
{
       
    this.createSequence();
  
};

BasicGame = 
{

};

// create Game function in BasicGame
BasicGame.Game = function (game) 
{
};


// set Game function prototype
BasicGame.Game.prototype = 
{

    init: function () {
        // set up input max pointers
        this.input.maxPointers = 1;
        // set up stage disable visibility change
        this.stage.disableVisibilityChange = true;
        // Set up the scaling method used by the ScaleManager
        // Valid values for scaleMode are:
        // * EXACT_FIT
        // * NO_SCALE
        // * SHOW_ALL
        // * RESIZE
        // See http://docs.phaser.io/Phaser.ScaleManager.html for full document
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // If you wish to align your game in the middle of the page then you can
        // set this value to true. It will place a re-calculated margin-left
        // pixel value onto the canvas element which is updated on orientation /
        // resizing events. It doesn't care about any other DOM element that may
        // be on the page, it literally just sets the margin.
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        // Force the orientation in landscape or portrait.
        // * Set first to true to force landscape. 
        // * Set second to true to force portrait.
        this.scale.forceOrientation(false, true);
        // Sets the callback that will be called when the window resize event
        // occurs, or if set the parent container changes dimensions. Use this 
        // to handle responsive game layout options. Note that the callback will
        // only be called if the ScaleManager.scaleMode is set to RESIZE.
        this.scale.setResizeCallback(this.gameResized, this);
        // Set screen size automatically based on the scaleMode. This is only
        // needed if ScaleMode is not set to RESIZE.
        this.scale.updateLayout(true);
        // Re-calculate scale mode and update screen size. This only applies if
        // ScaleMode is not set to RESIZE.
        this.scale.refresh();
        
        
        this.input.addPointer();

    },

    preload: function () {

        // Here we load the assets required for our preloader (in this case a 
        // background and a loading bar)
        this.load.image('logo', 'asset/phaser.png');
        
        this.load.image('red_firefly', 'asset/red_firefly.png');
        this.load.image('blue_firefly', 'asset/blue_firefly.png');
        this.load.image('orange_firefly', 'asset/orange_firefly.png');
        this.load.image('red_ring', 'asset/red_ring.png');
        this.load.image('blue_ring', 'asset/blue_ring.png');
        this.load.image('orange_ring', 'asset/orange_ring.png');

    },

    create: function () {
        // Add logo to the center of the stage
        this.fireflyRed =[];
        this.fireflyBlue =[];
        this.fireflyOrange =[];
        for( i = 0; i < 2; i++)
        {
            this.fireflyRed.push( new Firefly(this, 0,  'red_firefly', 'red_ring') );
            this.fireflyBlue.push( new Firefly(this, 1, 'blue_firefly', 'blue_ring') );
            this.fireflyOrange.push( new Firefly(this, 2, 'orange_firefly', 'orange_ring') );
        }
        this.comboScreen = new ComboScreen(this);
        
    },

    gameResized: function (width, height) {

        // This could be handy if you need to do any extra processing if the 
        // game resizes. A resize could happen if for example swapping 
        // orientation on a device or resizing the browser window. Note that 
        // this callback is only really useful if you use a ScaleMode of RESIZE 
        // and place it inside your main game state.

    },
    
    update: function()
    {
     },
    
    checkAlive: function()
    {
        for( i = 0 ; i < 2 ; i++)
        {
            if(this.fireflyRed[i].exists == false)
            {
                this.fireflyRed[i].destroy();
                this.fireflyRed[i].ring.destroy();
                this.fireflyRed.splice(i, 1);
                this.fireflyRed.push( new Firefly(this, 0, 'red_firefly', 'red_ring'));
            }
            if(this.fireflyBlue[i].exists == false)
            {
                this.fireflyBlue[i].destroy();
                this.fireflyBlue[i].ring.destroy();
                this.fireflyBlue.splice(i, 1);
                this.fireflyBlue.push( new Firefly(this, 1, 'blue_firefly', 'blue_ring'));
            }
            if(this.fireflyOrange[i].exists == false)
            {
                this.fireflyOrange[i].destroy();
                this.fireflyOrange[i].ring.destroy();
                this.fireflyOrange.splice(i, 1);
                this.fireflyOrange.push( new Firefly(this, 2, 'orange_firefly', 'orange_ring'));
            }
        }
    }

};