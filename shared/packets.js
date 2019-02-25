function EnterQueuePacket() {
} exports.EnterQueuePacket = EnterQueuePacket;

function GameStartPacket(playerIndex) {
    this.playerIndex = playerIndex;
} exports.GameStartPacket = GameStartPacket;

function NextTurnPacket(field, block, currentPlayerIndex, rolls, scores) {
    this.field = field;
    this.block = block;
    this.currentPlayerIndex = currentPlayerIndex;
    this.rolls = rolls;
    this.scores = scores;
} exports.NextTurnPacket = NextTurnPacket;

function PlaceBlockPacket(pos) {
    this.pos = pos;
} exports.PlaceBlockPacket = PlaceBlockPacket;

function GameEndPacket() {
} exports.GameEndPacket = GameEndPacket;

function ChatMessagePacket(message, from) {
    this.message = message;
    this.from = from;
} exports.ChatMessagePacket = ChatMessagePacket;