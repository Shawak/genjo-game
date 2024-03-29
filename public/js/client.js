function Client() {

    this.network = new EventHandler();

    var self = this;

    this.start = function () {
        this.socket = io(location.hostname + ':1234',
            {
                transports: ['websocket'],
                upgrade: false
            }
        );

        this.socket.on('connect', function () {
            console.log('connect');
        });

        this.socket.on('packet', function (data) {
            try {
                var packet = PacketManager.parse(data);
                console.log('RECV: %s', packet);
                console.log(packet);
                self.network.dispatch(self, packet);
            }
            catch (ex) {
                console.log(ex);
            }
        });

        this.socket.on('error', function (e) {
            console.log(e);
        });

        this.socket.on('disconnect', function () {
            console.log('disconnect');
        });
    };

    this.send = function (packet) {
        console.log('SEND: %s', packet);
        console.log(packet);
        this.socket.emit('packet', PacketManager.pack(packet));
    };

}