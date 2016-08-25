var lobbyRoomName = 'Lobby';
var VideoCenterServer = (function () {
    function VideoCenterServer() {
        this.Users = new Array();
        console.log("VideoCenterServer::constructor() ...");
    }
    VideoCenterServer.prototype.listen = function (socket, io) {
        var _this = this;
        console.log('VideoCenterServer::listen()');
        this.io = io;
        this.addUser(socket);
        socket.on('ping', this.pong);
        socket.on('update-username', function (username, callback) {
            _this.updateUsername(socket, username, callback);
        });
    };
    VideoCenterServer.prototype.addUser = function (socket) {
        var user = {};
        user.name = 'Anonymous';
        user.room = lobbyRoomName;
        user.socket = socket.id;
        this.Users[socket.id] = user;
        return this.Users[socket.id];
    };
    VideoCenterServer.prototype.setUser = function (user) {
        this.Users[user.socket] = user;
        return this.Users[user.socket];
    };
    VideoCenterServer.prototype.getUser = function (socket) {
        return this.Users[socket.id];
    };
    VideoCenterServer.prototype.setUsername = function (socket, username) {
        var user = this.getUser(socket);
        user.name = username;
        return this.setUser(user);
    };
    VideoCenterServer.prototype.updateUsername = function (socket, username, callback) {
        var user = this.setUsername(socket, username);
        callback(username);
    };
    VideoCenterServer.prototype.pong = function (callback) {
        console.log("I got ping. pong it.");
        callback('pong');
    };
    return VideoCenterServer;
}());
exports = module.exports = VideoCenterServer;
//# sourceMappingURL=video-center-3.4-server.js.map