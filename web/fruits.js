//Aliases & Global Vars
var game;
var keyleft=0;
var keyup=0;
var keyright=0;
var music=0;
var muteMusic=0;
var muteSounds=0;

function $(id) {return document.getElementById(id);}

//Global Functions
function newGame()
{
   if(game)
   {
      game.gameOver();
      setTimeout(function(){game=0;newGame();},50);
      return;
   }
   game=new Game();
   game.init();
   musicControl(true);
}

function musicControl(on)
{
   if(on=="swap")
      muteMusic=!muteMusic;
   if(!on || muteMusic)
      music=0;
   else
      music=1;
   $("musicControl").innerHTML="music "+(music?"on":"off");
   if(music)
   {
      $("music").currentTime=0;
      $("music").play();
   }
   else
      $("music").pause();
}

function soundControl()
{
   muteSounds=!muteSounds;
   $("soundControl").innerHTML="sounds "+(!muteSounds?"on":"off");
}

function gameLoop()
{
   if(!game.gameover)
   {
      game.loop();
      setTimeout(gameLoop,20) //about 50fps
   }
}

function keyControlDown(event)
{
   var control=true;
   switch(event.keyCode)
   {
      case 37: keyleft=1; control=false;break;
      case 38: keyup=1;   control=false;break;
      case 39: keyright=1;control=false;break;
      case 40: control=false;
   }
   //Cheats
   if(document.URL.substring(document.URL.length-6,document.URL.length)=="cheats")
   {
      switch(event.keyCode)
      {
         case 66: game.bonus_floor=new Bonus(3);break;
         case 84: game.bonus_clock=new Bonus(2);break;
         case 107: game.health+=30;
      }
   }
   return control;
}

function keyControlUp(event)
{
   var control=true;
   switch(event.keyCode)
   {
      case 37: keyleft=0; control=false;break;
      case 38: keyup=0;   control=false;break;
      case 39: keyright=0;control=false;break;
      case 40: control=false;
   }
   return control;
}

//Sound Control
function Sound(id)
{
   this.audio=document.createElement("audio");
   this.audio.setAttribute("src","sounds/"+id+".ogg");
   this.audio.load();
   this.play=function()
   {
      if(muteSounds)
         return;
      this.audio.currentTime=0;
      if(this.audio.paused)
         this.audio.play();
   }
}

var sounds=new Object();
sounds.bomb=new Sound("bomb");
sounds.fruit=new Sound("fruit");
sounds.heart=new Sound("heart");
sounds.fall=new Sound("fall");
sounds.timebullet=new Sound("timebullet");
sounds.floor=new Sound("floor");

//Game Class
function Game()
{
   //--graphics
   this.context=0;
   //--sprites
   this.bg=0;
   this.fruits_sprites=0;
   this.player_sprites=0;
   this.heart=0;
   this.clock=0;
   this.floor=0;
   //--entities
   this.fruits=0;
   this.player=0;
   this.bonus_floor=0;
   this.bonus_heart=0;
   this.bonus_clock=0;
   //--game control
   this.loaded=0;
   this.points=0;
   this.health=0;
   this.frames=0;
   this.with_floor=0;
   this.with_clock=0;
   this.floor_end=0;
   this.clock_end=0;
   this.gameover=false;
   //--time
   this.start=0;
   this.seconds=0;
   //--others
   this.n_fruits=0;
   this.n_resources=21;
   this.idata=0; //image data of tunned background
   //------------------------------------------------------
   this.init=function()
   {
      //-- graphics
      var canvas=$('canvas')
      this.context=canvas.getContext('2d');
      this.context.strokeStyle="white";
      this.context.strokeText("loading... please, wait",50,50);
      //-- load control
      var load=function(uri){var img=new Image();img.onload=loaded;img.src=uri;return img;}
      var loaded=function() {game.loaded++;game.checkLoad();}
      //-- load resources
      this.bg=load("sprites/bg.jpg");    //background
      this.heart=load("sprites/b1.png"); //bonus heart
      this.clock=load("sprites/b2.png"); //bonus clock
      this.floor=load("sprites/b3.png"); //bonus floor
      this.fruits_sprites=new Array();   //array of fruits sprites
      for(var i=1;i<=9;i++)
         this.fruits_sprites[i]=load("sprites/"+i+".png");
      this.player_sprites=new Array();   //array of player sprites
      for(var i=1;i<=8;i++)
         this.player_sprites[i]=load("sprites/fox"+i+".png");
      //-- reset vars
      this.points=0;
      this.health=150;
      this.frames=0;
      this.with_floor=0;
      this.with_clock=0;
      this.bonus_heart=0;
      this.bonus_clock=0;
      this.bonus_floor=0;
      this.floor_end=0;
      this.clock_end=0;
      this.n_fruits=2;
      this.gameover=false;
      this.start=new Date();
      this.player=new Player();
      this.fruits=new Array();
      for(var i=0;i<this.n_fruits;i++)
         this.fruits[i]=new Fruit();
   }
   this.checkLoad=function()
   {
      if(this.loaded<this.n_resources)
      {
         //--progress bar
         var width=Math.round(700/(this.n_resources-1));
         this.context.fillStyle="rgb(255,255,255)";
         this.context.fillRect(50+(width*(this.loaded-1)),275,width,40);
         return;
      }
      //Here all resources are loaded, so... let's go!
      this.loadBWBackground(); //create a tunned dataImage of the background
      gameLoop();
   }
   this.loadBWBackground=function()
   {
      var auxcanvas=document.createElement("canvas");
      auxcanvas.setAttribute("width","800px");
      auxcanvas.setAttribute("height","600px");
      var auxcontext=auxcanvas.getContext("2d");
      auxcontext.drawImage(this.bg,0,0);
      var idata=auxcontext.getImageData(0,0,800,600);
      for(var i=0;i<idata.width;i++)
      {
         for(var j=0;j<idata.height;j++)
         {
            var index=4*(j*idata.width+i);
            var avg=Math.round((idata.data[index]+idata.data[index+1]+idata.data[index+2])/3);
            idata.data[index]=idata.data[index+1]=avg;
            idata.data[index+2]*=0.5;
         }
      }
      this.idata=idata;
   }
   this.gameOver=function()
   {
      this.gameover=true;
      this.context.save();
      this.context.fillStyle="rgba(0, 0, 0, 0.9)";  
      this.context.fillRect(0,0,800,600);
      this.context.shadowColor="rgb(255,255,255)";
      this.context.shadowBlur="15";
      this.context.font="75px Arial";
      this.context.textAlign="center";
      this.context.strokeText("GAME OVER",400,275);
      this.context.restore();
      musicControl(false);
   }
   this.increment=function()
   {
      if(this.seconds>900){this.n_fruits=11;return;}
      if(this.seconds>600){this.n_fruits=10;return;}
      if(this.seconds>300){this.n_fruits=9;return;}
      if(this.seconds>45) {this.n_fruits=8;return;}
      if(this.seconds>30) {this.n_fruits=7;return;}
      if(this.seconds>25) {this.n_fruits=6;return;}
      if(this.seconds>15) {this.n_fruits=5;return;}
      if(this.seconds>10) {this.n_fruits=4;return;}
      if(this.seconds>5) {this.n_fruits=3;return;}
   }
   this.loop=function()
   {
      //control
      var now=new Date();
      this.increment();
      this.seconds=(now-this.start)/1000;
      this.frames++;
      //clean and draw background
      if(!this.with_clock)
         this.context.drawImage(this.bg,0,0);
      else
         this.context.putImageData(this.idata,0,0);
      //draw floor
      if(this.with_floor)
      {
         this.context.fillStyle="rgba(100,175,255,0.5)";
         this.context.fillRect(0,595,800,5);
      }
      //draw health hearts
      for(var i=0;i<this.health;i+=30)
      {
         if(i>this.health-30)
            break;
         this.context.drawImage(this.heart,i+5,5);
      }
      var mod=this.health%30;
      if(mod)
         this.context.drawImage(this.heart, 0, 0, mod, 30, i+5, 5, mod, 30);
      //draw and move bonus
      if(this.bonus_heart)
      {
         this.bonus_heart.render(this.context);
         if(this.bonus_heart.y>600)
            this.bonus_heart=0;
      }
      if(this.bonus_clock)
      {
         this.bonus_clock.render(this.context);
         if(this.bonus_clock.y>600)
            this.bonus_clock=0;
      }
      if(this.bonus_floor)
      {
         this.bonus_floor.render(this.context);
         if(this.bonus_floor.y>600)
            this.bonus_floor=0;
      }
      //draw and move fruits
      for(var i=0;i<this.n_fruits;i++)
      {
         if(!this.fruits[i])
            this.fruits[i]=new Fruit();
         this.fruits[i].render(this.context);
         if(this.fruits[i].y>600)
         {
            sounds.fall.play();
            if(this.fruits[i].type!=9)
               this.health-=5;
            this.fruits[i]=new Fruit();
         }
         if(this.fruits[i].y>this.player.y && this.fruits[i].y<this.player.y+50 && this.fruits[i].x+30>this.player.x && this.fruits[i].x<this.player.x+50) //collision
         {
            if(this.fruits[i].type==9) //bomb
            {
               sounds.bomb.play();
               this.health-=15;
            }
            else //Fruit
            {
               sounds.fruit.play();
               this.points+=this.fruits[i].points;
               $("points").innerHTML=this.points;
            }
            this.fruits[i]=new Fruit();
         }
      }
      //check bonus collision
      if(this.bonus_heart && this.bonus_heart.y>this.player.y && this.bonus_heart.y<this.player.y+50 && this.bonus_heart.x+30>this.player.x && this.bonus_heart.x<this.player.x+50)
      {
         sounds.heart.play();
         this.health+=30;
         this.bonus_heart=0;
      }
      if(this.bonus_clock && this.bonus_clock.y>this.player.y && this.bonus_clock.y<this.player.y+50 && this.bonus_clock.x+30>this.player.x && this.bonus_clock.x<this.player.x+50)
      {
         sounds.timebullet.play();
         this.with_clock=1;
         this.bonus_clock=0;
         this.clock_end=this.seconds+5;
      }
      if(this.bonus_floor && this.bonus_floor.y>this.player.y && this.bonus_floor.y<this.player.y+50 && this.bonus_floor.x+50>this.player.x && this.bonus_floor.x<this.player.x+50)
      {
         sounds.floor.play();
         this.with_floor=1;
         this.bonus_floor=0;
         this.floor_end=this.seconds+15;
      }
      //bonus death
      if(this.seconds>this.clock_end)
         this.with_clock=0;
      if(this.seconds>this.floor_end)
         this.with_floor=0;
      //bonus respawn
      if(this.seconds>30 && !this.bonus_heart && this.frames%1500==0)
         this.bonus_heart=new Bonus(1);
      if(this.seconds>45 && !this.bonus_clock && this.frames%750==0 && Math.random()>0.7)
         this.bonus_clock=new Bonus(2);
      if(this.seconds>20 && !this.bonus_floor && this.frames%500==0 && Math.random()>0.9)
         this.bonus_floor=new Bonus(3);
      //draw Player
      this.player.render(this.context);
      if(this.health<0)
         this.gameOver();
   }
}

//Fruit Class
function Fruit()
{
   this.type=Math.round(Math.random()*7)+1;
   if(Math.random()>0.95)
      this.type=9;              //fruit bomb
   this.v=Math.random()*5+1;    //v in pixels/frame
   this.y=-30;                  //coord y
   this.x=Math.random()*750+25; //coord x
   this.img=new Image();        //sprite
   this.img.src="sprites/"+this.type+".png";
   this.points=0;
   switch(this.type)
   {
      case 2:this.points=10;break;
      case 3:this.points=15;break;
      case 8:this.points=25;break;
      case 7:this.points=50;break;
      case 5:this.points=75;break;
      case 6:this.points=100;break;
      case 4:this.points=150;break;
      case 1:this.points=250;break;
   }
   this.render=function(context)
   {
      context.drawImage(this.img,this.x,this.y);
      if(game.with_floor && this.y>=565)
      {
         this.y=565;
         return;
      }
      if(game.with_clock)
         this.y+=(this.v*0.25); //time-bullet!
      else
         this.y+=this.v; //fall
   }
}

//Bonus Class
function Bonus(type)
{
   this.type=type;              //1=heart; 2=clock; 3=floor
   this.v=Math.random()*5+1;    //v in pixels/frame
   this.y=-30;                  //coord y
   this.x=Math.random()*750+25; //coord x
   this.img=new Image();        //sprite
   this.img.src="sprites/b"+this.type+".png";
   this.render=function(context)
   {
      context.drawImage(this.img,this.x,this.y);
      if(game.with_floor && this.y>=565)
      {
         this.y=565;
         return;
      }
      if(game.with_clock)
         this.y+=(this.v*0.25); //time-bullet!
      else
         this.y+=this.v; //fall
   }
}

//Player Class
function Player()
{
   this.x=100;
   this.y=550;
   this.vx=0;
   this.vy=0;
   this.frames=0;
   this.right=0;
   //- Sprites
   this.sprites=new Array();
   for(var i=1;i<=8;i++)
   {
     this.sprites[i]=new Image();
	  this.sprites[i].src="sprites/fox"+i+".png";
   }
   this.render=function(context)
   {
      this.frames++;
      //- Movement
      if(keyleft)
      {
         if(this.right)
            this.vx=-1; //Fast stop
         else
            this.vx--;
         this.right=0;
      }
   	else if(keyright)
      {
         if(!this.right)
            this.vx=1; //Fast stop
         else
            this.vx++;
         this.right=1;
      }
      else
         this.vx*=0.9;
      //- Limits
      if(this.x<0 || this.x>750)
         this.vx=0;
      this.vx=Math.max(this.vx,-15); //vx limits
      this.vx=Math.min(this.vx,+15); //vx limits
      //- Jump
      if(this.vy!=0) //Gravity
         this.vy+=1.5;
      if(keyup && this.y==550)
         this.vy=-20;
      if(((keyright && this.x==0) || (keyleft && this.x==750)) && this.y<550) //Super-Jump
      {
         if(this.x==0)
            keyleft=0;
         else
            keyright=0;
         this.vy=-20;
      }
      if(this.y>550)
      {
         this.vy=0;
         this.y=550;
      }
      this.y+=this.vy;
      this.x+=this.vx;
      this.x=Math.max(this.x,0);   //scroll limits
      this.x=Math.min(this.x,750); //scroll limits
      //Render
      var i=5;
      if(this.vy==0 && Math.abs(this.vx)>0.2) //Run
			i=(Math.round(this.frames/2)%8)+1;
      else if(this.vy>0) //Jumping
         i=8;
      else if(this.vy<0) //Falling
         i=4;
      context.save();
      if(this.right)
      {
         context.translate(800, 0);
         context.scale(-1, 1);
         context.drawImage(this.sprites[i],800-this.x-50,this.y);
         context.restore();
      }
      else
         context.drawImage(this.sprites[i],this.x,this.y);
   }
}

//Window control and event listeners
window.onkeydown=keyControlDown;
window.onkeyup=keyControlUp;
