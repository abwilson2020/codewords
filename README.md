# Codewords
A remake of the game [codenames](https://codenames.game/)

Two teams (red and blue) take turns giving clues and guessing which cards on a board of 25 correspond to their team. 

Each team has 2 roles (Spymaster, Operative).

**The Spymaster**
- Each team has 1 spymaster
- Each spymaster can see which cards belong to which team and the black card
- They give clues at the start of their teams turn which consists of a word and a number

**The Operative(s)**
- Each team has at least 1 operative
- The operatives have to guess which cards belong to their team by using the clues from the spymaster

## How to Play
- Start by giving your username/name and joining a room. 
  - If a player is the first to join a room they become the host in that room

![Login screen](https://github.com/abwilson2020/codewords/blob/master/github-readme/login.PNG)

- Once in a lobby click the yellow button to join a team and assign a role
  - Each team will only be allowed 1 spymaster, if a team already has a spymaster the button will be hidden

![Host view of lobby](https://github.com/abwilson2020/codewords/blob/master/github-readme/lobby.PNG)

- Once all players have joined the lobby and have been assigned roles the game can begin.
  - First the red team spymaster should give a clue by filling in the clue fields at the bottom of their screen.
  - Next the red operatives can use the clue to determine which cards on the game board need to be clicked
    - Clicking a card that belongs to their team will continue the red operatives turn
    - Clicking a card that does not belong to their team will end their turn
    - Clicking the black card will end the game and the other team will win
  - Play alternates until one team successfully clicks all of their cards or the black card is clicked. 
    - The background color of the game shows which team's turn it is

![Host view of lobby](https://github.com/abwilson2020/codewords/blob/master/github-readme/Operative%20View.PNG)

![Host view of lobby](https://github.com/abwilson2020/codewords/blob/master/github-readme/Spymaster%20view.PNG)
## Getting Started

- To use: run server.js and go to localhost:3000.
- Play here : [Glitch page hosting project](https://pine-cactus-iodine.glitch.me/)

## TO DO
- [X] Add functionality to allow operatives to end guessing without getting a card wrong
- [X] Add game log
- [X] Add game status message
- [ ] Add Audio
- [ ] Add Extra word lists and a way to select them
- [ ] Create timed version of game
- [ ] Add in replay after game ends
- [ ] Add functionality for user to join in after game has started and a turn has passed
- [ ] Make responsive to mobile/tablet
- [ ] Update header information with game info and title
- [ ] Fix bug where room doesn't get deleted when all users leave the room

## Built With

- [Microsoft Visual Studio](https://visualstudio.microsoft.com/)
- [NodeJS V14.17.0](https://nodejs.org/en/)
- [Socket.IO V4.3.2](https://socket.io/)

## Author

- Created by Andrew Wilson
