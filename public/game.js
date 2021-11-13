var socket;
var host = false; //tracks who is hosting the game
var cards; //Track the cards which belong to which team during the game.
var role = "none"; //Track the players role in the game
var team; //Track which team the player is on
var turn = "red";
var redCardsRemaining = 4;
var blueCardsRemaining = 4;
var redCards = document.getElementById('red-team-score');
var blueCards = document.getElementById('blue-team-score');
var redOperatives = [];
var blueOperatives = [];
var redSpymaster = [];
var blueSpymaster = [];
var gameStarted = false;
var lastClue = {
  team: "none",
  clue: "blank",
  number: 0
}

document.getElementById('start-game-button').addEventListener('click', startGame);
document.getElementById('submit-clue').addEventListener('click', submitClue);
document.getElementById('join-red-operative').addEventListener('click', setRole);
document.getElementById('join-blue-operative').addEventListener('click', setRole);
document.getElementById('join-red-spymaster').addEventListener('click', setRole);
document.getElementById('join-blue-spymaster').addEventListener('click', setRole);


var username = 'user-' + makeId(5).toLowerCase();
var room = 'room-' + makeId(5).toLowerCase();

setupConnections();


function setupConnections() {
  socket = io.connect('http://localhost:3000');
  socket.on('game-start', gameSetup);
  socket.on('role-changed', updateRoles);
  socket.on('tile-clicked', handleTileClicked);
  socket.on('new-room-connection', updateConnection);
  socket.on('make-host', makeHost);
  socket.on('update-game-state', updateGameState);
  socket.on('new-clue', newClue);
  setNickname();
  setRoom();
}
function makeHost(){
  console.log("make host");
  host = true;
}
function updateConnection(data){
  console.log("NEW CONNECTION TO ROOM: ", data);
  if(host){
    pushGameState();
  }
}
function pushGameState(){
  console.log(redOperatives.length);
  var gameState = {
    redOps: redOperatives,
    blueOps: blueOperatives,
    redSpy: redSpymaster,
    blueSpy: blueSpymaster,
    gameStarted: gameStarted,
    cards: cards,
    turn: turn,
    lastClue: lastClue
  }
  socket.emit('push-game-state', gameState);
}
function updateGameState(data){
  console.log("data", data);
  document.getElementById('red-operative-menu').innerHTML = data.redOps.join('&nbsp');
  document.getElementById('red-operative').innerHTML = data.redOps.join('&nbsp');
  document.getElementById('blue-operative-menu').innerHTML = data.blueOps.join('&nbsp');
  document.getElementById('blue-operative').innerHTML = data.blueOps.join('&nbsp');
  document.getElementById('red-spymaster-menu').innerHTML = data.redSpy.join('&nbsp');
  document.getElementById('red-spymaster').innerHTML = data.redSpy.join('&nbsp');
  document.getElementById('blue-spymaster-menu').innerHTML = data.blueSpy.join('&nbsp');
  document.getElementById('blue-spymaster').innerHTML = data.blueSpy.join('&nbsp');

  if (data.redSpy.length > 0){
    document.getElementById("join-red-spymaster").style.display = "none";
  } 
  if (data.blueSpy.length > 0){
    document.getElementById("join-blue-spymaster").style.display = "none";
  }
  console.log("ROLE: ", role);
  console.log("gameStarted: ", gameStarted);
  console.log("data.gameStarted: ", data.gameStarted);
  if (!gameStarted && data.gameStarted && role != "none"){
    turn = data.turn;
    lastClue = lastClue;
    gameSetup(data.cards);
  }
}
function makeId(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function setNickname(){
  username = prompt('Choose a username', username);
  if (!username){
    username = "test";
  }
  socket.emit('set-nickname', username);
}

function setRoom(){
  room = prompt('Choose a room', room);
  if (!room){
    room = "test";
  }
  socket.emit('join-room', room);
}

function updateRoles(data){
  console.log("Role data: ", data);
  if(host){
    if(data.role == "operative"){
      if (data.team == "red"){
        redOperatives[redOperatives.length] = data.user;
      } else {
        blueOperatives[blueOperatives.length] = data.user;
      }
    } else {
      if (data.team == "red"){
        redSpymaster[redSpymaster.length] = data.user;
      } else {
        blueSpymaster[blueSpymaster.length] = data.user;
      }
    }
    pushGameState();
    var roles = {
      redOps: redOperatives,
      blueOps: blueOperatives,
      redSpy: redSpymaster,
      blueSpy: blueSpymaster,
    }
    updateGameState(roles);
  }
}

/*
* Start the game
*/
function startGame(){
  console.log("start-game");
  cards = getCards();

  var data = {
    cards: cards
  }

  socket.emit('game-start', data); //We have to emit the cards so everyone gets the same randomized list
  
  gameSetup(cards);
  gameStarted = true;
}

function setRole(e){
  console.log("E: ", e.target.id);
  if (e.target.id.search("blue") != -1){
    console.log("successfully joined the blue team");
    team = "blue";
  } else {
    console.log("successfully joined the red team");
    team = "red";
  }

  if (e.target.id.search("operative") != -1){
    console.log("successfully joined as an operative");
    role = "operative";
  } else {
    console.log("successfully joined as a spymaster");
    role = "spymaster";
  }
  document.querySelectorAll(".button").forEach(button => button.style.display = "none");

  var data = {
    user: username,
    role: role,
    team: team
  }

  socket.emit('role-changed', data);
}

//pick a random set of cards to play with
function getCards(){
  var arr = [];
  while(arr.length < 9){
      var r = Math.floor(Math.random() * 25).toString();
      if(arr.indexOf(r) === -1) arr.push(r);
  }
  console.log("ARR ", arr)
  return arr;
}


//Get the word list and populate the game cards
let gameTile;
let gameBoard = document.getElementById('game-board');

async function gameSetup(data) {
  document.getElementById('menu-screen').style.display = "none"; //Hide the menu screen
  document.getElementById('game-screen').style.display = "block"; //Reveal the game screen
  if (role == "operative"){
    document.getElementById('clue').style.display = "none";
    document.getElementById('number').style.display = "none";
    document.getElementById('submit-clue').style.display = "none";
  }
  
  cards = data; //setup the list of cards for each team

  const response = await fetch('assets/word-list.csv');
  const words = await response.text();
  // console.log("DATA", words);
  const rows = words.split('\n');
  gameBoard.innerHTML = "";
  var i = 0;
  rows.forEach(row => {
      const data = row.split(',');
      const word = data[0];
      gameTile = document.createElement('div');
      gameTile.classList.add('game-tile');
      gameTile.innerHTML = word;
      gameTile.id = "game-tile-" + i;
      gameBoard.append(gameTile);
      if(role == "operative"){
        gameTile.addEventListener('click', tileClicked);
      } else if (role == "spymaster"){ //Setup spymaster view of board
        console.log(cards.indexOf(i.toString()), i);
        if(cards.indexOf(i.toString()) == -1){
          gameTile.classList.add("tile-none");
        } else if(cards.indexOf(i.toString()) < ((cards.length -1) / 2)){
          console.log("tile-red", i);
          gameTile.classList.add("tile-red");
        } else if (cards.indexOf(i.toString()) == (cards.length -1)){
          gameTile.classList.add("tile-black")
        } else {
          gameTile.classList.add("tile-blue");
        }
      }


      i++;
  });

  updateCardsRemaining();
}

/*
* Handle the click on a tile when current player is the one that clicked the tile
*/
function tileClicked(e){
  console.log("E:", e.target.id);
  if (team != turn){
    alert("it is not your teams turn");
  } else {
    var data = {
      user: username,
      tile: e.target.id,
      team: team
    }
    socket.emit('tile-clicked', data);
    handleTileClicked(data);
  }
}

/*
* Handle the click on a tile when another player is the one that clicked the tile
*/
var tile;
var tileId;
function handleTileClicked(data){
  // console.log("TILE:", data.tile);
  tile = document.getElementById(data.tile);
  tile.removeEventListener('click', tileClicked, false);
  console.log("tile:", tile);
  tileId = data.tile.split('-')
  console.log("tileID: ", tileId);
  console.log("CARDS: ", cards);
  if (cards.indexOf(tileId[2]) != -1){
    console.log("CARD IN LIST: ", tileId[2]); //
    console.log(cards.indexOf(tileId[2]));
    if(cards.indexOf(tileId[2]) < ((cards.length -1) / 2)){
      console.log("Card is RED");
      tile.classList.add("tile-red");
      redCardsRemaining--;
      console.log("RED CARDS REMAINING: ", redCardsRemaining);
      updateCardsRemaining();
      if(redCardsRemaining <= 0){
        gameOver("red");
      }
      if (turn == "blue"){
        turn = "red";
      }
    } else if (cards.indexOf(tileId[2]) == (cards.length -1)){
      console.log("Card was BLACK");//Game ends
      tile.classList.add("tile-black");
      if (turn == "red"){
        gameOver("blue");
      } else {
        gameOver("red");
      }
    } else {
      console.log("Card is BLUE");
      tile.classList.add("tile-blue");
      blueCardsRemaining--;
      console.log("BLUE CARDS REMAINING: ", blueCardsRemaining);
      updateCardsRemaining();
      if(blueCardsRemaining <= 0){
        gameOver("blue");
      }
      if (turn == "red"){
        turn = "blue";
      }
    }
  } else {
    console.log("CARD NOT IN LIST: ", tileId[2]);
    tile.classList.add("tile-none");
    //Change turns
    if(turn == "red"){
      turn = "blue";
    } else {
      turn = "red";
    }
  }

}

function updateCardsRemaining(){
  console.log("updateCardsRemaining()", redCardsRemaining, blueCardsRemaining);
  redCards.innerHTML = redCardsRemaining;
  blueCards.innerHTML = blueCardsRemaining;
}
function gameOver(winner){
  console.log("TEAM " + winner + " WINS");
  alert(winner + " team wins");
}

function submitClue(){
  if(team != turn){
    alert("It is not your teams turn yet");
  } else if(lastClue.team == team){
    alert("you have already given your team a clue this turn");
  } else if (document.getElementById('clue').value == ""){
    alert("You need to set a clue");
  } else {
    lastClue = {
      team: team,
      clue: document.getElementById('clue').value,
      number: document.getElementById('number').value
    }
    socket.emit('new-clue', lastClue);
  }
  console.log("SUBMIT CLUE: ", document.getElementById('number').value, document.getElementById('clue').value);
  newClue(lastClue);
}

function newClue(data){
  console.log("CLUE RECEIVED: ", data);
  lastClue = data;
  document.getElementById('clue-word').innerHTML = data.clue;
  document.getElementById('clue-number').innerHTML = data.number;
}