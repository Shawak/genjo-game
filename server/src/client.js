const EventHandler = require('./../../shared/eventHandler.js');
const PacketManager = require('./../../shared/packetManager.js');

class Client {

    constructor(server, id, socket) {
        this.server = server;
        this.id = id;
        this.socket = socket;

        this.socket.on('packet', (data) => {
            try {
                let packet = PacketManager.parse(data);
                this.network.dispatch(this, packet);
            } catch (ex) {
                console.log(ex);
            }
        });

        this.network = new EventHandler();
    }

    send(packet) {
        this.socket.emit('packet', PacketManager.pack(packet));
    }

}

module.exports = Client;