const Packets = require('./../../shared/packets.js');

class Game {

    constructor(clients) {
        this.clients = clients;
        this.currentPlayerIndex = 0;
        this.turnCount = 0;
        this.width = 33;
        this.height = 55;
        this.field = array(this.width, this.height);
        this.block = [[]];
        this.positions = [];
        this.iter((x, y) => this.tile(x, y, -1));

        for (let client of clients) {
            client.network.link(Packets.PlaceBlockPacket, this.onPlaceBlockPacket, this);
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

        let positions = this.getPlaceablePositions(this.block, this.currentPlayerIndex);
        if (positions.length === 0) {
            this.broadcast(new Packets.ChatMessagePacket((this.currentPlayerIndex === 0 ? 'Red' : 'Blue') + ' player can not place block (' + rolls[0] + 'x' + rolls[1] + '), skipping turn!'));
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.clients.length;
            positions = this.getPlaceablePositions(this.block, this.currentPlayerIndex);
            if (positions.length === 0) {
                this.broadcast(new Packets.ChatMessagePacket('Nobody can place block (' + rolls[0] + 'x' + rolls[1] + '), ending the game!'));
                this.endGame();
                return;
            }
        }

        this.positions = positions;
        this.broadcast(new Packets.NextTurnPacket(this.field, this.block, this.currentPlayerIndex, rolls, this.calculateScores(), positions));
    }

    endGame() {
        let score = this.calculateScores();
        this.broadcast(new Packets.ChatMessagePacket((score[0] > score[1] ? 'Red' : 'Blue') + ' player wins!'));
        this.broadcast(new Packets.GameEndPacket());
    }

    canPlace(pos, block, playerIndex) {
        return this.hasFriendlyNeighbour(pos, block, playerIndex) && this.isPosFree(pos, block);
    }

    hasFriendlyNeighbour(pos, block, playerIndex) {
        // bounds check
        if (pos.x < 0 || pos.x + block.length > this.field.length ||
            pos.y < 0 || pos.y + block[0].length > this.field[0].length)
            return false;

        // allow starting position
        if (pos.y === 0 && playerIndex === 0)
            return true;

        if (pos.y === this.field[0].length - block[0].length && playerIndex === 1)
            return true;

        // allow x neighbours
        for (let x = pos.x; x < pos.x + block.length; x++)
            if (this.field[x][pos.y - 1] === playerIndex)
                return true;

        for (let x = pos.x; x < pos.x + block.length; x++)
            if (this.field[x][pos.y + block[0].length] === playerIndex)
                return true;

        // allow y neighbours
        if (pos.x !== 0)
            for (let y = pos.y; y < pos.y + block[0].length; y++)
                if (this.field[pos.x - 1][y] === playerIndex)
                    return true;

        if (pos.x < this.field.length - block.length)
            for (let y = pos.y; y < pos.y + block[0].length; y++)
                if (this.field[pos.x + block.length][y] === playerIndex)
                    return true;
    }

    isPosFree(pos, block) {
        for (let by = 0; by < block[0].length; by++) {
            for (let bx = 0; bx < block.length; bx++) {
                let fy = by + pos.y;
                let fx = bx + pos.x;
                if (fy < 0 || fy >= this.field[0].length ||
                    fx < 0 || fx >= this.field.length)
                    return false;

                if (this.field[fx][fy] !== -1)
                    return false;
            }
        }
        return true;
    }

    getPlaceablePositions(block, playerIndex) {
        let positions = [];
        this.iter((x, y) => {
            let pos = { x : x, y: y };
            if (this.canPlace(pos, block, playerIndex))
                positions.push(pos);
        });
        return positions;
    }

    onPlaceBlockPacket(sender, packet) {
        if (sender !== this.clients[this.currentPlayerIndex])
            return;

        let valid = false;
        for (let pos of this.positions) {
            if (pos.x === packet.pos.x && pos.y === packet.pos.y) {
                valid = true;
                break;
            }
        }

        if (!valid)
            return;

        this.broadcast(new Packets.ChatMessagePacket((this.currentPlayerIndex === 0 ? 'Red' : 'Blue') + ' player => x: ' + packet.pos.x + ' y: ' + packet.pos.y));
        for (let y = 0; y < this.block[0].length; y++) {
            for (let x = 0; x < this.block.length; x++) {
                this.field[packet.pos.x + x][packet.pos.y + y] = this.currentPlayerIndex;
            }
        }

        this.nextTurn();
    }

    onChatMessagePacket(sender, packet) {
        this.broadcast(packet);
    }
}

module.exports = Game;