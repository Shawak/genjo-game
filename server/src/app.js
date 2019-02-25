const PacketManager = require('./../../shared/packetManager.js');
const Packets = require('./../../shared/packets.js');
PacketManager.initialize(Packets);

const WebServer = require('./webServer.js'),
    GameServer = require('./gameServer.js');

global.array = function array(length) {
    let arr = new Array(length || 0);
    if (arguments.length > 1) {
        let args = Array.prototype.slice.call(arguments, 1);
        let i = length;
        while (i--) arr[length - 1 - i] = array.apply(this, args);
    }
    return arr;
};

new GameServer().start();
new WebServer().start();

console.log("Server running!");