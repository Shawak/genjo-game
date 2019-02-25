(function() {

    var ENABLE_AUTO_PLAY = window.location.hash === '#autoplay';

    var settings = {
        field: {
            width: 33,
            height: 55,
            size: 11
        }
    };

    var game = {
        currentRolls: null,
        mousePos: null,
        block: null,
        field: null,
        scores: null,
        positions: null,
        end: false,

        playerIndex: -1,
        currentPlayerIndex: -1,

        opacity: 1
    };

    var client = new Client();
    client.start();

    var canvas = document.getElementById('game');
    var bg = background();
    var g = canvas.getContext('2d');

    g.clearRect(0, 0, canvas.width, canvas.height);

    function rgb(r, g, b) {
        return  '#' +
            ('0' + parseInt(r, 10).toString(16)).slice(-2) +
            ('0' + parseInt(g, 10).toString(16)).slice(-2) +
            ('0' + parseInt(b, 10).toString(16)).slice(-2);
    }

    function background() {
        var bg = document.createElement('canvas');
        bg.width = canvas.width;
        bg.height = canvas.height;

        var g = bg.getContext('2d');
        g.clearRect(0, 0, canvas.width, canvas.height);

        // draw grid
        g. strokeStyle = rgb(190, 190, 190);
        for (var y = 1; y < settings.field.height; y++) {
            g.moveTo(0.5, y * settings.field.size + 0.5);
            g.lineTo(canvas.width + 0.5, y * settings.field.size + 0.5);
            g.stroke();
        }
        for (var x = 1; x < settings.field.width; x++) {
            g.moveTo(x * settings.field.size + 0.5, 0.5);
            g.lineTo(x * settings.field.size + 0.5, canvas.height + 0.5);
            g.stroke();
        }

        return bg;
    }

    function draw() {
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.drawImage(bg, 0, 0);

        // draw already taken blocks
        if (game.field != null)
            for (var y = 0; y < game.field[0].length; y++) {
                for (var x = 0; x < game.field.length; x++) {
                    if (game.field[x][y] === 0) {
                        g.fillStyle = 'rgb(255, 0, 0)';
                        g.fillRect(x * settings.field.size, y * settings.field.size, settings.field.size, settings.field.size);
                    } else if (game.field[x][y] === 1) {
                        g.fillStyle = 'rgb(0, 0, 255)';
                        g.fillRect(x * settings.field.size, y * settings.field.size, settings.field.size, settings.field.size);
                    }
                }
            }

        if (game.playerIndex !== game.currentPlayerIndex || game.end)
            return;

        // draw hover block
        g.fillStyle = game.playerIndex === 0 ? 'rgba(255, 0, 0, ' + game.opacity + ')' : 'rgba(0, 0, 255, ' + game.opacity + ')';
        if (game.mousePos !== null && game.currentRolls !== null)
            g.fillRect(game.mousePos.x * settings.field.size, game.mousePos.y * settings.field.size,
                game.currentRolls[0] * settings.field.size, game.currentRolls[1] * settings.field.size);
    }

    draw();

    // min & max inclusive
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function canPlace(pos) {
        for (var i = 0; i < game.positions.length; i++) {
            if (game.positions[i].x === pos.x && game.positions[i].y === pos.y) {
                return true;
            }
        }
        return false;
    }

    function toFieldPos(e) {
        var r = canvas.getBoundingClientRect(),
            rx = e.clientX - r.left,
            ry = e.clientY - r.top;
        return {
            x: Math.floor(rx / settings.field.size),
            y: Math.floor(ry / settings.field.size)
        };
    }

    canvas.onmousemove = function(e) {
        var pos = toFieldPos(e);
        if (pos.x < 0 || pos.x > settings.field.width ||
            pos.y < 0 || pos.y > settings.field.height)
            return;

        game.mousePos = pos;
        game.opacity = canPlace(game.mousePos) ? 1 : 0.5;
        draw();
    };

    canvas.onclick = function(e) {
        var pos = toFieldPos(e);
        if (!canPlace(pos))
            return;

        client.send(new PlaceBlockPacket(pos));
    };

    function onGameStartPacket(sender, packet) {
        game.playerIndex = packet.playerIndex;
        document.getElementById('waiting').style.display = 'none';
        document.getElementById('game-wrapper').style.display = 'block';
    }

    function onNextTurnPacket(sender, packet) {
        game.field = packet.field;
        game.block = packet.block;
        game.currentPlayerIndex = packet.currentPlayerIndex;
        game.currentRolls = packet.rolls;
        game.scores = packet.scores;
        game.positions = packet.positions;

        document.getElementById('red').innerText = game.scores[0];
        document.getElementById('blue').innerText = game.scores[1];

        draw();

        if (game.currentPlayerIndex === game.playerIndex && ENABLE_AUTO_PLAY) {
            client.send(new PlaceBlockPacket(game.positions[random(0, game.positions.length - 1)]));
        }
    }

    function onChatMessagePacket(sender, packet) {
        var chat = document.getElementById('chat');
        switch (packet.from) {
            case undefined: packet.from = ""; break;
            case 0: packet.from = "Red: "; break;
            case 1: packet.from = "Blue: "; break;
        }
        chat.value += (chat.value !== "" ? "\n" :"") + packet.from + packet.message;
        chat.scrollTop = chat.scrollHeight
    }

    function onGameEndPacket(sender, packet) {
        game.end = true;
    }

    document.getElementById('chat-message').onkeydown = function(e) {
        if (e.code === 'Enter') {
            var elem = document.getElementById('chat-message');
            var msg = elem.value;
            client.send(new ChatMessagePacket(msg, game.playerIndex));
            elem.value = '';
        }
    };

    client.network.link(GameStartPacket, onGameStartPacket, this);
    client.network.link(NextTurnPacket, onNextTurnPacket, this);
    client.network.link(ChatMessagePacket, onChatMessagePacket, this);
    client.network.link(GameEndPacket, onGameEndPacket, this);

    client.send(new EnterQueuePacket());

})();