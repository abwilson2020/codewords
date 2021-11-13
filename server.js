var express = require('express');
require('dotenv').config();
var app = express();
var port = process.env.PORT || 3000;
var server = app.listen(port);

app.use(express.static('public'));

console.log("My socket server is running");

var socket = require('socket.io');

var io = socket(server);

io.sockets.on('connection', newConnection);

var connections = 0;
var rooms = [];

function newConnection(socket){
    connections++;
    socket.broadcast.emit('new-connection', connections)
    console.log("NEW CONNECTION: ", socket.id, socket.nickname);
    console.log("CONNECTIONS: ", connections);

    socket.on('set-nickname', setNickName);
    socket.on('join-room', joinRoom);


    socket.on('disconnect', disconnect);
    socket.on('game-start', startGame);
    socket.on('tile-clicked', tileClicked);
    socket.on('role-changed', roleChange);
    socket.on('push-game-state', updateGameState);
    socket.on('new-clue', newClue);

    function roleChange(data){
        console.log("ROLE CHANGE: ", data);
        io.to(socket.room).emit('role-changed', data);
    }
    function updateGameState(data){
        console.log("Game state: ", data);
        socket.to(socket.room).emit('update-game-state', data);
    }
    function startGame(data){
        console.log("DATA: ", data.cards);
        socket.to(socket.room).emit('game-start', data.cards);
    }

    function tileClicked(data){
        console.log("Tile Clicked: ", data);
        socket.to(socket.room).emit('tile-clicked', data);
    }

    function disconnect(){
        connections--;
        console.log("DISCONNECT ", socket.id);
        console.log("CONNECTIONS: ", connections);
        // socket.to(socket.room).emit('disconnect', connections);
    }
    function setNickName(data){
        socket.nickname = data
        console.log("NICKNAME SET: ",socket.nickname);
    }

    function joinRoom(room){
        socket.join(room);
        socket.room = room;
        console.log("socket.room", socket.room);
        socket.to(room).emit("new-room-connection", room);
        if(rooms.indexOf(room) == -1){
            console.log("creating new room");
            rooms.push(room);
            console.log(rooms);
            io.to(room).emit("make-host");
        }
    }

    function newClue(data){
        console.log("new clue: ", data);
        socket.to(socket.room).emit("new-clue", data);
    }
}