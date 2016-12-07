var meld = require("meld");
var counter = 0;

var executor = {
    logger: null,
    setLogger(logger) {
        this.logger = logger;
    },

    exec(io, req, res) {
        var id = ++counter;
        if (!io) {
            return;
        }

        this._emitRequest(io, req, id);
        meld.before(req, "write", this._emitRequestBodyChunk.bind(this, io, id));
        req.on("end", this._emitRequestBodyEnd.bind(this, io, id));

        meld.before(res, "writeHead", this._emitResponse.bind(this, io, res, id));
        meld.before(res, "write", this._emitResponseBodyChunk.bind(this, io, id));
        res.on("finish", this._emitResponseBodyEnd.bind(this, io, id));
    },

    _emitRequest(io, req, id) {
        this.logger.trace(`emiting request #${id} for ${req.url}`);
        io.emit("request", {
            id,
            url: req.url,
            origUrl: req.origUrl,
            method: req.method,
            headers: req.headers
        });
    },

    _emitResponse(io, res, id, statusCode) {
        this.logger.trace(`emiting response for #${id}`);
        io.emit("response", {
            id,
            statusCode,
            headers: res._headers //no API to get all?
        });
    },

    _emitRequestBodyChunk(io, id, chunk) {
        io.emit("request-body-chunk", {
            id,
            chunk
        });
    },

    _emitRequestBodyEnd(io, id) {
        io.emit("request-body-end", {
            id
        });
    },

    _emitResponseBodyChunk(io, id, chunk) {
        io.emit("response-body-chunk", {
            id,
            chunk
        });
    },

    _emitResponseBodyEnd(io, id) {
        io.emit("response-body-end", {
            id
        });
    }
};

module.exports = executor;
