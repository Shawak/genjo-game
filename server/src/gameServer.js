const io = require('socket.io');

const Packets = require('./../../shared/packets.js');
const Client = require('./client.js');
const Game = require('./game.js');

class GameServer {

    constructor() {
        this.clients = [];
        this.waitingClient = null;

        this.server = io();
        this.server.on('connection', socket => {
            let id = 0;
            while (this.clients.find(client => client.id === id))
                id++;

            let client = new Client(this, id, socket);
            this.clients.push(client);
            console.log('client #' + id + ' has connected.');

            client.network.link(Packets.EnterQueuePacket, this.onEnterQueuePacket, this);

            socket.on('disconnect', () => {
                let client = this.clients.find(client => client.socket === socket);
                //client.onDisconnect.dispatch();
                this.clients.splice(this.clients.indexOf(client), 1);
                console.log('client #' + client.id + ' has disconnected.');
            });
        });
    }

    start() {
        this.server.listen(1234);
    }

    onEnterQueuePacket(sender, packet) {
        if (this.waitingClient == null) {
            this.waitingClient = sender;
            return;
        }

        let game = new Game([this.waitingClient, sender]);
        this.waitingClient = null;
        game.start();
    }

}

module.exports = GameServer;