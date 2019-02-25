const Packets = require('./../../shared/packets.js');

class Game {

    constructor(clients) {
        this.clients = clients;
        this.currentPlayerIndex = 0;
        this.turnCount = 0;

        // field is 33x55
        /*this.field = new Array(33);
        for (let x = 0; x < 55; x++) {
            this.field[x] = new Array(55);
        }*/
        this.width = 33;
        this.height = 55;
        this.field = array(this.width, this.height);
        this.block = [[]];
        this.iter((x, y) => this.tile(x, y, -1));

        for (let client of clients) {
            client.network.link(Packets.PlaceBlockPacket, this.onPlaceBlockPacket, this);
            client.network.link(Packets.GameEndPacket, this.onGameEndPacket, this);
            client.network.link(Packets.ChatMessagePacket, this.onChatMessagePacket, this);
        }
    }

    start() {
        for (let i = 0; i < this.clients.length; i++) {
            this.clients[i].send(new Packets.GameStartPacket(i));
        }
        this.currentPlayerIndex = this.random(0, 1);
        this.nextTurn();
    }

    broadcast(packet) {
        for (let client of this.clients) {
            client.send(packet);
        }
    }

    tile(x, y, v) {
        if (v !== undefined)
            this.field[x][y] = v;
        return this.field[x][y];
    }

    iter(func) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                func(x, y);
            }
        }
    }

    // min & max inclusive
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    generateBlock(rolls, v) {
        let arr = array(rolls[0], rolls[1]);
        for (let y = 0; y < rolls[1]; y++) {
            for (let x = 0; x < rolls[0]; x++) {
                arr[x][y] = v;
            }
        }
        return arr;
    }

    calculateScores() {
        let scores = [0, 0];
        this.iter((x, y) => {
            let v = this.field[x][y];
            if (v !== -1)
                scores[v]++;
        });
        return scores;
    }

    nextTurn() {
        this.turnCount++;

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.clients.length;

        let rolls = [this.random(1, 6), this.random(1, 6)];
        this.block = this.generateBlock(rolls, this.currentPlayerIndex);
        this.broadcast(new Packets.NextTurnPacket(this.field, this.block, this.currentPlayerIndex, rolls, this.calculateScores()));
    }

    onPlaceBlockPacket(sender, packet) {
        if (sender !== this.clients[this.currentPlayerIndex])
            return;

        this.broadcast(new Packets.ChatMessagePacket((this.currentPlayerIndex === 0 ? 'Red' : 'Blue') + ' player => x: ' + packet.pos.x + ' y: ' + packet.pos.y));

        // TODO: sanitize user input
        for (let y = 0; y < this.block[0].length; y++) {
            for (let x = 0; x < this.block.length; x++) {
                this.field[packet.pos.x + x][packet.pos.y + y] = this.currentPlayerIndex;
            }
        }
        this.nextTurn();
    }

    onGameEndPacket(sender, packet) {
        let score = this.calculateScores();
        this.broadcast(new Packets.ChatMessagePacket((score[0] > score[1] ? 'Red' : 'Blue') + ' player wins!'));
    }

    onChatMessagePacket(sender, packet) {
        this.broadcast(packet);
    }
}

module.exports = Game;