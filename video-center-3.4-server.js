/// <reference path="typings/globals/node/index.d.ts" />
/// <reference path="typings/globals/socket.io/index.d.ts" />
/// import fs = require('fs');
/// import oo = require('socket.io');
var VideoCenterServer = (function () {
    function VideoCenterServer() {
        console.log("VideoCenterServer::constructor()");
    }
    VideoCenterServer.prototype.listen = function (socket, io) {
        console.log('VideoCenterServer::listen()');
        this.socket = socket;
        this.io = io;
        socket.on('ping', function (callback) {
            console.log("I got ping. pong it.");
            callback('pong');
        });
    };
    return VideoCenterServer;
}());
exports = module.exports = VideoCenterServer;
//# sourceMappingURL=video-center-3.4-server.js.map