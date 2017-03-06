var socketIO = require("socket.io");

const EventEmitter = require("events");

class IoManager extends EventEmitter {
	constructor() {
		super();
		this.propagatedClientEvents = [
			"configupdate",
			"configreplace",
			"kill"
		];
	}

	setLogger(logger) {
		this.logger = logger;
	}

	setupSocketIO(httpServer, config) {
		let options = config["pro-xy-ws-api"] && config["pro-xy-ws-api"].allowRemoteConnect ? {} : {
			allowRequest : (message, callback) => {
				let address = message.socket.address();
				callback(null, address.address == "127.0.0.1" || address.address == "::1" );
			}
		};
		this.io = socketIO(httpServer, options);
		this.io.on("connection", socket => this._handleConnection(socket));
		this.logger.debug("socket.io was setup on httpServer");
	}

	_handleConnection(socket) {
		this.propagatedClientEvents.forEach(eName => socket.on(eName, msg => this.emit(eName, msg)));
		this.emit("clientconnected", socket);
	}

	closeSocketIO() {
		this.io.close();
		delete this.io;
		this.logger.debug("socket.io was closed");
	}

	broadcast(name, message) {
		this.io && this.io.emit(name, message);
	}

	getIO() {
		return this.io;
	}
}

module.exports = new IoManager();
