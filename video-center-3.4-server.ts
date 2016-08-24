/// <reference path="typings/globals/node/index.d.ts" />
/// <reference path="typings/globals/socket.io/index.d.ts" />
/// import fs = require('fs');
/// import oo = require('socket.io');
class VideoCenterServer {
    private socket: any;
    private io: any;
    constructor() {
        console.log("VideoCenterServer::constructor() ...");
    }
    listen(socket, io) {
        console.log('VideoCenterServer::listen()');
        this.socket = socket;
        this.io = io;


        socket.on('ping', function( callback ) {
            console.log("I got ping. pong it.");
            callback('pong');
        });
    }
}
exports = module.exports = VideoCenterServer;
