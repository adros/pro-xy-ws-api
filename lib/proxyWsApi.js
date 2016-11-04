var socketIO = require("socket.io");
var logger = require("log4js").getLogger("pro-xy-ws-api");

var config, io, proxy;

function init(_proxy) {
	proxy = _proxy;
	proxy.on("serverstarted", setupSocketIO);
	proxy.on("serverstop", closeSocketIO);
	config = proxy.getConfig();
}

function exec(config, req/*, res*/) {
	if (!io) {
		return;
	}

	logger.trace(`emiting request for ${req.url}`);
	io.emit("request", {
		url: req.url,
		method: req.method
	});
}

function setupSocketIO(httpServer) {
	io = socketIO(httpServer);
	io.on("connection", handleConnection);
	logger.debug("socket.io was setup on httpServer");
}

function closeSocketIO() {
	io.close();
	io = null;
	logger.debug("socket.io was closed");
}

function handleConnection(socket) {
	logger.debug(`User connected "${socket}", sending config`);
	socket.emit("config", config);
	socket.on("configupdate", updateConfig);
}

function updateConfig(newConfig) {
	logger.debug(`configupdate received`, newConfig);
	proxy.setConfig(Object.assign(config, newConfig));
}

module.exports = {
	init,
	exec
};
