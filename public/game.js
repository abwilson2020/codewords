var socket;
var host = false; //Tracks who is hosting the game
var cards; //Tracks the cards which belong to which team during the game.
var role = "none"; //Tracks the players role in the game
var team; //Tracks which team the player is on
var turn = "red"; //Tracks which teams turn it is
var redCardsRemaining = 4; //Tracks the number of cards remaining for the red team
var blueCardsRemaining = 4; //Tracks the number of cards remaining for the blue team
var redCards = document.getElementById('red-team-score'); //Displays the number of cards remaining for the red team
var blueCards = document.getElementById('blue-team-score'); //Displays the number of cards remaining for the red team
var redOperatives = []; //Array which holds the red operative usernames
var blueOperatives = []; //Array which holds the blue operative usernames
var redSpymaster = []; //Array which holds the red spymaster username
var blueSpymaster = []; //Array which holds the blue spymaster username
var gameStarted = false; //Tracks if the game has been started or not

//initialize a last clue sent
var lastClue = {
  team: "none",
  clue: "blank",
  number: 0
}

let logMessage;
let gameLog = document.getElementById('game-log');

const background = document.getElementById('game');
const gameMessage = document.getElementById('game-status-message');

//Listener for the submit info button on the login screen
document.getElementById('submit-info').addEventListener('click', submitInfo);

//Lobby role buttons
document.getElementById('join-red-operative').addEventListener('click', setRole);
document.getElementById('join-blue-operative').addEventListener('click', setRole);
document.getElementById('join-red-spymaster').addEventListener('click', setRole);
document.getElementById('join-blue-spymaster').addEventListener('click', setRole);
document.getElementById('start-game-button').addEventListener('click', startGame);

//Game play buttons
document.getElementById('submit-clue').addEventListener('click', submitClue);
document.getElementById('end-guessing').addEventListener('click', endGuessing);


var username = 'user-' + makeId(5).toLowerCase();
var room = 'room-' + makeId(5).toLowerCase();

/*
 * Function to hide the login screen and show the lobby screen of the room that was typed.
 */
function submitInfo(){
  document.getElementById('login-screen').style.display = "none";
  document.getElementById('menu-screen').style.display = "block";
  setupConnections();
}

/*
 * Function to setup the socket connections to the server and the listeners for socket messages
 */
function setupConnections() {
  socket = io.connect('http://localhost:3000');
  socket.on('make-host', makeHost);
  socket.on('game-start', gameSetup);
  socket.on('role-changed', updateRoles);
  socket.on('tile-clicked', handleTileClicked);
  socket.on('new-room-connection', updateConnection);
  socket.on('update-game-state', updateGameState);
  socket.on('new-clue', newClue);
  socket.on('end-guessing', handleEndGuessing);
  setNickname();
  setRoom();
}

/*
 * If a user is the first to join a room, then they become the host of that room
 */
function makeHost(){
  host = true;
  document.getElementById('start-game-button').style.display = "block";
  document.getElementById('member-message').style.display = "none";
}

/*
 * If a user joins a room and this instance is the host, 
 * push the host's game state to the new player.
 * 
 * This syncs the host and new player's games
 */
function updateConnection(data){
  if(host){
    pushGameState();
  }
}

/*
 * Push the host's game state to the other players in the room
 */
function pushGameState(){
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

/*
 * Update the player's game state with the host's data
 */
function updateGameState(data){
  document.getElementById('red-operative-menu').innerHTML = data.redOps.join('&nbsp');
  document.getElementById('red-operative').innerHTML = data.redOps.join('&nbsp');
  document.getElementById('blue-operative-menu').innerHTML = data.blueOps.join('&nbsp');
  document.getElementById('blue-operative').innerHTML = data.blueOps.join('&nbsp');
  document.getElementById('red-spymaster-menu').innerHTML = data.redSpy.join('&nbsp');
  document.getElementById('red-spymaster').innerHTML = data.redSpy.join('&nbsp');
  document.getElementById('blue-spymaster-menu').innerHTML = data.blueSpy.join('&nbsp');
  document.getElementById('blue-spymaster').innerHTML = data.blueSpy.join('&nbsp');

  //If there is already a red spy, hide the button that would allow a player to become the red spy
  if (data.redSpy.length > 0){
    document.getElementById("join-red-spymaster").style.display = "none";
  } 

  //If there is already a blue spy, hide the button that would allow a player to become the blue spy
  if (data.blueSpy.length > 0){
    document.getElementById("join-blue-spymaster").style.display = "none";
  }

  /*
   * If the player joins after the game has started for the host, and they have a role and their game hasn't started.
   * update the current turn and last clue to the host's data, then update the game board to the game's cards.
   */
  if (!gameStarted && data.gameStarted && role != "none"){
    turn = data.turn;
    lastClue = lastClue;
    gameSetup(data.cards);
  }
}

/*
 * Creates a random ID with a given length
 */
function makeId(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

/*
 * Function to set the users nickname in the server for messages
 * Leaving the username field blank on the info screen sets the users name to test
 */
function setNickname(){
  username = document.getElementById('username').value;
  if (!username){
    username = "test";
  }
  socket.emit('set-nickname', username);
}

/*
 * Function to join the room that was typed on the login screen
 * Leaving the room field blank on the info screen has them join a room named 'test'
 */
function setRoom(){
  room = document.getElementById('room').value;
  if (!room){
    room = "test";
  }
  socket.emit('join-room', room);
}

function updateRoles(data){
  // console.log("Role data: ", data);
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
  if(redOperatives.length == 0 || blueOperatives.length == 0 || redSpymaster.length == 0 || blueSpymaster.length == 0){
    alert("Both teams need at least 1 spymaster and 1 operative to play");
  } else if(role == "none"){
    alert("You haven't picked a role yet"); //this will only show up for the host
  } else {
    cards = getCards();
    var data = {
      cards: cards
    }
    socket.emit('game-start', data); //We have to emit the cards so everyone gets the same randomized list
    gameSetup(cards);
    gameStarted = true;
  }
}

function setRole(e){
  // console.log("E: ", e.target.id);
  if (e.target.id.search("blue") != -1){
    // console.log("successfully joined the blue team");
    team = "blue";
  } else {
    // console.log("successfully joined the red team");
    team = "red";
  }

  if (e.target.id.search("operative") != -1){
    // console.log("successfully joined as an operative");
    role = "operative";
  } else {
    // console.log("successfully joined as a spymaster");
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

/*
 * Pick a random set of cards to play with
 * The first half of the cards will be the red teams, 
 * The second half of the cards will be the blue teams,
 * The last Card is the black card. 
 */
function getCards(){
  var arr = [];
  while(arr.length < 9){ //9 is for 4 cards to each team plus 1 black card, this should always be an odd number
      var r = Math.floor(Math.random() * 25).toString();
      if(arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}


//Get the word list and populate the game cards
let gameTile;
let gameBoard = document.getElementById('game-board');

/*
* Setup the game
*/
async function gameSetup(data) {
  document.getElementById('menu-screen').style.display = "none"; //Hide the menu screen
  document.getElementById('game-screen').style.display = "block"; //Reveal the game screen
  gameMessage.innerHTML = "The Red Spymaster is giving a clue...";

  // If the player is an operative hide the clue giving fields
  if (role == "operative"){
    document.getElementById('clue-submit-container').style.display = "none";

    //if the player is on the blue team, they shouldn't see the end guessing button to start
    if (team == "blue"){
      document.getElementById('end-guessing-container').style.visibility = "hidden";
    }

  //If the player is a spymaster, they shouldn't see the end guessing button
  } else {
    document.getElementById('end-guessing-container').style.display = "none";
  }
  
  cards = data; //setup the list of cards for each team

  const response = await fetch('assets/word-list.csv'); //get the list of words for the game TODO: add more lists and a way to select from them
  const words = await response.text();
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
        gameTile.addEventListener('click', tileClicked);//Add event listeners for when an operative clicks on a tile
      } else if (role == "spymaster"){ //Setup spymaster view of board
        if(cards.indexOf(i.toString()) == -1){
          gameTile.classList.add("tile-none-spy");
        } else if(cards.indexOf(i.toString()) < ((cards.length -1) / 2)){
          gameTile.classList.add("tile-red-spy");
        } else if (cards.indexOf(i.toString()) == (cards.length -1)){
          gameTile.classList.add("tile-black-spy")
        } else {
          gameTile.classList.add("tile-blue-spy");
        }
      }
      i++;
  });

  updateCardsRemaining();//Update the UI with the updated score
}

/*
* Handle the click on a tile when current player is the one that clicked the tile
*/
function tileClicked(e){
  if (team != turn){
    alert("it is not your teams turn");
  } else if (lastClue.team != team){
    alert("Wait for your spymaster to send a clue");
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
* Handle the click on a tile
*/
var tile;
var tileId;
var tileColor;
function handleTileClicked(data){
  tile = document.getElementById(data.tile);
  tile.removeEventListener('click', tileClicked, false); //Make it so this tile cannot be clicked again
  tileId = data.tile.split('-')

  //Check to see if the tile is a red/blue/black card
  if (cards.indexOf(tileId[2]) != -1){
    // console.log("CARD IN LIST: ", tileId[2]);

    //If the card is in the first half of the list -1, it is a red card
    if(cards.indexOf(tileId[2]) < ((cards.length -1) / 2)){
      // console.log("Card is RED");
      tileColor = "red";
      tile.classList.add("tile-red"); //This turns the card red on the board
      redCardsRemaining--; //Remove 1 from the red teams cards remaining
      updateCardsRemaining(); //Update the UI with the updated score
      
      //If the red team has no cards remaining, they win
      if(redCardsRemaining <= 0){
        gameOver("red");
      }

      //If the blue team clicked a red team card, their turn ends
      if (turn == "blue"){
        turn = "red";
        background.style.backgroundColor = "#C2492F";
        gameMessage.innerHTML = "The Red Spymaster is giving a clue...";

        //If the player is on the blue team, then hide the end-guessing button becuase their turn ended
        if (team == "blue"){
          document.getElementById('end-guessing-container').style.visibility = "hidden";
        } else {
          document.getElementById('end-guessing-container').style.visibility = "visible";
        }
      }

    //If the card is the last card in the list of cards, it was the black card
    } else if (cards.indexOf(tileId[2]) == (cards.length -1)){
      // console.log("Card was BLACK"); //Game ends
      tileColor = "black";
      tile.classList.add("tile-black"); //This turns the card black on the board

      if (turn == "red"){
        gameOver("blue");
      } else {
        gameOver("red");
      }

    //If the card is in the list, but isn't red or black, it is blue
    } else {
      // console.log("Card is BLUE");
      tileColor = "blue";
      tile.classList.add("tile-blue"); //This turns the card blue on the board
      blueCardsRemaining--; //Remove 1 from the red teams cards remaining
      updateCardsRemaining(); //Update the UI with the updated score

      //If the blue team has no cards remaining, they win
      if(blueCardsRemaining <= 0){
        gameOver("blue");
      }

      //If the red team clicked a blue team card, their turn ends
      if (turn == "red"){
        turn = "blue";
        background.style.backgroundColor = "#354065"
        gameMessage.innerHTML = "The Blue Spymaster is giving a clue...";

        //If the player is on the red team, then hide the end-guessing button becuase their turn ended
        if (team == "red"){
          document.getElementById('end-guessing-container').style.visibility = "hidden";
        } else {
          document.getElementById('end-guessing-container').style.visibility = "visible";
        }
      }
    }
  } else {
    // console.log("CARD NOT IN LIST: ", tileId[2]);
    tile.classList.add("tile-none"); //This turns the card tan on the board
    tileColor = "none";
    
    //Change turns
    if(turn == "red"){
      turn = "blue";
      background.style.backgroundColor = "#354065"
      gameMessage.innerHTML = "The Blue Spymaster is giving a clue...";

      //If the player is on the red team, then hide the end-guessing button becuase their turn ended
      if (team == "red"){
        document.getElementById('end-guessing-container').style.visibility = "hidden";
      } else {
        document.getElementById('end-guessing-container').style.visibility = "visible";
      }
    } else {
      turn = "red";
      background.style.backgroundColor = "#C2492F"
      gameMessage.innerHTML = "The Red Spymaster is giving a clue...";

      //If the player is on the blue team, then hide the end-guessing button becuase their turn ended
      if (team == "blue"){
        document.getElementById('end-guessing-container').style.visibility = "hidden";
      } else {
        document.getElementById('end-guessing-container').style.visibility = "visible";
      }
    }
  }
  tile.innerHTML = ""; //remove the text from the card that was clicked

  logMessage = document.createElement('p'); //create a new paragraph element for the game log
  logMessage.classList.add('game-log-message');
  logMessage.classList.add('game-log-message-' + data.team);
  logMessage.innerHTML = data.user + " guesses <span class = \"game-log-guess-" + tileColor  + "\">"+ tile.innerHTML + "</span>"; //add the message to the new element
  gameLog.append(logMessage); //add the new message to the game log
}

/*
 * Update the UI with the team's cards remaining
 */
function updateCardsRemaining(){
  redCards.innerHTML = redCardsRemaining;
  blueCards.innerHTML = blueCardsRemaining;
}

/*
 * Display the game over popup with the winning team
 */
function gameOver(winner){
  // console.log("TEAM " + winner + " WINS");
  document.getElementById('game-over').innerHTML = winner + " team wins!";
  document.getElementById('game-over').style.display = "flex";
}

/*
 * Submit a new clue to the players
 */
function submitClue(){
  if(team != turn){
    alert("It is not your teams turn yet");
  } else if(lastClue.team == team){
    alert("you have already given your team a clue this turn");
  } else if (document.getElementById('clue').value == ""){
    alert("You need to set a clue");
  } else {
    lastClue = {
      user: username,
      team: team,
      clue: document.getElementById('clue').value,
      number: document.getElementById('number').value
    }
    socket.emit('new-clue', lastClue);
    newClue(lastClue);
  }
}

/*
 * Display the latest clue received
 */
function newClue(data){
  lastClue = data;
  document.getElementById('clue-word').innerHTML = data.clue;
  document.getElementById('clue-number').innerHTML = data.number;

  gameMessage.innerHTML = "The " + turn + " team is guessing...";


  logMessage = document.createElement('p'); //create a new paragraph element for the game log
  logMessage.classList.add('game-log-message');
  logMessage.classList.add('game-log-message-' + data.team);
  logMessage.innerHTML = data.user + " gives clue " + data.clue + " " + data.number; //add the message to the new element
  gameLog.append(logMessage); //add the new message to the game log
}

/*
 * Handle end-guessing button click
 */
function endGuessing (){
  if (team != turn){
    alert("it is not your teams turn");
  } else if (lastClue.team != team){
    alert("Wait for your spymaster to send a clue");
  } else {
    var data = {
      user: username,
      team: team
    }
    socket.emit('end-guessing', data);
    handleEndGuessing(data);
  }
}

/*
 * Handle when a player ends the guessing
 */
function handleEndGuessing(data){
  logMessage = document.createElement('p'); //create a new paragraph element for the game log
  logMessage.classList.add('game-log-message');
  logMessage.classList.add('game-log-message-' + data.team);
  logMessage.innerHTML = data.user + " ended guessing"; //add the message to the new element
  gameLog.append(logMessage);//add the new message to the game log

  //Switch Turns
  if(turn == "red"){
    turn = "blue";
    background.style.backgroundColor = "#354065"
    gameMessage.innerHTML = "The Blue Spymaster is giving a clue...";

    //If the player is on the red team, then hide the end-guessing button becuase their turn ended
    if (team == "red"){
      document.getElementById('end-guessing-container').style.visibility = "hidden";
    } else {
      document.getElementById('end-guessing-container').style.visibility = "visible";
    }
  } else {
    turn = "red";
    background.style.backgroundColor = "#C2492F"
    gameMessage.innerHTML = "The Red Spymaster is giving a clue...";

    //If the player is on the blue team, then hide the end-guessing button becuase their turn ended
    if (team == "blue"){
      document.getElementById('end-guessing-container').style.visibility = "hidden";
    } else {
      document.getElementById('end-guessing-container').style.visibility = "visible";
    }
  }
  
}