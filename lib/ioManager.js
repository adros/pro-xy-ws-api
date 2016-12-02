var socketIO = require("socket.io");
var config, io, proxy, logger;

const EventEmitter = require("events");

var ioManager = new EventEmitter();

class IoManager extends EventEmitter {
    constructor() {
        super();
        this.propagatedClientEvents = ["configupdate", "configreplace", "kill"];
    }

    setLogger(logger) {
        this.logger = logger;
    }

    setupSocketIO(httpServer) {
        this.io = socketIO(httpServer);
        this.io.on("connection", socket => this._handleConnection(socket));
        this.logger.debug("socket.io was setup on httpServer");
    }

    _handleConnection(socket) {
        this.logger.debug(`User connected "${socket.request.connection.remoteAddress}", sending config`);
        this.propagatedClientEvents.forEach(eName => socket.on(eName, msg => this.emit(eName, msg)));
        this.emit("clientconnected", socket);
    }

    closeSocketIO() {
        this.io.close();
        delete this.io;
        this.logger.debug("socket.io was closed");
    }

    broadcast(name, message) {
        this.io && this.io.emit("config", config);
    }

    getIO() {
        return this.io;
    }
}

module.exports = new IoManager();