var express = require('express');
require('dotenv').config();
var app = express();
var port = process.env.PORT || 3000;
var server = app.listen(port);

app.use(express.static('public'));

var socket = require('socket.io');

var io = socket(server);

io.sockets.on('connection', newConnection);

var rooms = [];

function newConnection(socket){
    console.log("NEW CONNECTION: ", socket.id, socket.nickname);
    socket.on('set-nickname', setNickName);
    socket.on('join-room', joinRoom);
    socket.on('disconnect', disconnect);
    socket.on('game-start', startGame);
    socket.on('tile-clicked', tileClicked);
    socket.on('role-changed', roleChange);
    socket.on('push-game-state', updateGameState);
    socket.on('new-clue', newClue);
    socket.on('end-guessing', endGuessing);

    function roleChange(data){
        // console.log("ROLE CHANGE: ", data);
        io.to(socket.room).emit('role-changed', data);
    }

    function updateGameState(data){
        // console.log("Game state: ", data);
        socket.to(socket.room).emit('update-game-state', data);
    }

    function startGame(data){
        // console.log("DATA: ", data.cards);
        socket.to(socket.room).emit('game-start', data.cards);
    }

    function tileClicked(data){
        // console.log("Tile Clicked: ", data);
        socket.to(socket.room).emit('tile-clicked', data);
    }

    function disconnect(){
        if(socket.room !== undefined){
            let roomIndex = rooms.findIndex(roomID => roomID.roomID == socket.room);
            if(rooms[roomIndex].occupants == 1){
                rooms.splice(roomIndex, 1);
            } else {
                rooms[roomIndex].occupants -= 1;
            }
        }
    }

    function setNickName(data){
        socket.nickname = data
        // console.log("NICKNAME SET: ",socket.nickname);
    }

    function joinRoom(room){
        socket.join(room);
        socket.room = room;
        socket.to(room).emit("new-room-connection", room);
        //If the room does not exist, create it and make the user that joined it the host of that room
        if(!rooms.find(roomID => roomID.roomID == room)){
            let roomData = {
                "roomID" : room,
                "occupants" : 1
            }
            rooms.push(roomData);
            io.to(room).emit("make-host");
        } else {
            let roomIndex = rooms.findIndex(roomID => roomID.roomID == room);
            rooms[roomIndex].occupants += 1;
        }
    }

    function newClue(data){
        // console.log("new clue: ", data);
        socket.to(socket.room).emit("new-clue", data);
    }
    function endGuessing(data){
        // console.log("end-guessing", data);
        socket.to(socket.room).emit("end-guessing", data);
    }
}