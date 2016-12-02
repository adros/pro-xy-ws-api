var socketIO = require("socket.io");

var config, io, proxy, logger;

function init(_proxy, _logger) {
	proxy = _proxy;
	logger = _logger;
	proxy.on("serverstarted", setupSocketIO);
	proxy.on("serverstop", closeSocketIO);
	proxy.on("configupdated", handleNewProxyConfig);

	config = proxy.getConfig();
}

function exec(config, req/*, res*/) {
	if (!io) {
		return;
	}

	logger.trace(`emiting request for ${req.url}`);
	io.emit("request", {
		url: req.url,
		origUrl: req.origUrl,
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
	logger.debug(`User connected "${socket.request.connection.remoteAddress}", sending config`);
	socket.emit("config", config);
	socket.on("configupdate", updateConfig);
	socket.on("configreplace", replaceConfig);
	socket.on("kill", suicide);
}

function handleNewProxyConfig(newConfig) {
	config = newConfig;
	logger.debug(`emitting new newConfig`);
	io.emit("config", config);

}

function updateConfig(newConfig) {
	logger.debug(`configupdate received`, newConfig);
	proxy.setConfig(Object.assign(config, newConfig));
}

function replaceConfig(newConfig) {
	logger.debug(`configreplace received`, newConfig);
	proxy.setConfig(newConfig);
}

function suicide() {
	logger.debug(`kill message received, exiting process`);
	process.exit(0);
}

module.exports = {
	init,
	exec
};
