const EventHandler = require('./../../shared/eventHandler.js');
const PacketManager = require('./../../shared/packetManager.js');
const Packets = require('./../../shared/packets.js');

const Event = require('./event.js');

class Client {

    constructor(server, id, socket) {
        this.server = server;
        this.id = id;
        this.socket = socket;
        this.user = null;
        this.onDisconnect = new Event(this);
        this.onDisconnect.add(() => {
            if (this.user) {
                console.log(this.user.name + ' logged out.')
            }
        }, this);

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