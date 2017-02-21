var executor = require("./executor");
var ioManager = require("./ioManager");
var config, proxy, logger;

function init(_proxy, _logger) {
    proxy = _proxy;
    logger = _logger;

    config = proxy.getConfig();

    proxy.on("serverstarted", httpServer => ioManager.setupSocketIO(httpServer, config));
    proxy.on("serverstop", () => ioManager.closeSocketIO());
    proxy.on("configupdated", handleNewProxyConfig);

    executor.setLogger(logger);
    ioManager.setLogger(logger);

    // messages from client
    ioManager.on("configupdate", updateConfig);
    ioManager.on("configreplace", replaceConfig);
    ioManager.on("kill", suicide);

    ioManager.on("clientconnected", socket => {
        logger.debug(`User connected "${socket.request.connection.remoteAddress}", emitting new newConfig`);
        socket.emit("config", config);
    });
}

function exec(config, req, res) {
    executor.exec(ioManager.getIO(), req, res);
}

function handleNewProxyConfig(newConfig) {
    config = newConfig;
    logger.debug(`emitting new newConfig`);
    ioManager.broadcast("config", config);
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
