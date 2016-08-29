var lobbyRoomName = 'Lobby';
var VideoCenterServer = (function () {
    function VideoCenterServer() {
        this.Users = new Array();
        console.log("VideoCenterServer::constructor() ...");
    }
    VideoCenterServer.prototype.listen = function (socket, io) {
        var _this = this;
        console.log('Someone Connected.');
        this.io = io;
        this.addUser(socket);
        socket.on('disconnect', function () {
            _this.disconnect(socket);
        });
        socket.on('join-lobby', function (callback) {
            _this.joinLobby(socket, callback);
        });
        socket.on('update-username', function (username, callback) {
            _this.updateUsername(socket, username, callback);
        });
        socket.on('send-message', function (message, callback) {
            _this.sendMessage(io, socket, message, callback);
        });
        socket.on('log-out', function (callback) {
            _this.logout(socket, callback);
        });
    };
    VideoCenterServer.prototype.pong = function (callback) {
        console.log("I got ping. pong it.");
        callback('pong');
    };
    VideoCenterServer.prototype.disconnect = function (socket) {
        this.removeUser(socket.id);
        console.log("Someone Disconnected.");
    };
    VideoCenterServer.prototype.logout = function (socket, callback) {
        var user = this.getUser(socket);
        socket.leave(user.room);
        this.removeUser(socket);
        console.log(user.name + ' has logged out.');
        callback();
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
        var user_info = this.getUser(socket);
        var oldusername = user_info.name;
        var user = this.setUsername(socket, username);
        console.log(oldusername + " change it's name to " + username);
        callback(username);
    };
    VideoCenterServer.prototype.sendMessage = function (io, socket, message, callback) {
        var user = this.getUser(socket);
        io.sockets["in"](user.room).emit('get-message', { message: message, name: user.name, room: user.room });
        callback(message);
    };
    VideoCenterServer.prototype.removeUser = function (id) {
        delete this.Users[id];
    };
    VideoCenterServer.prototype.joinLobby = function (socket, callback) {
        socket.join(lobbyRoomName);
        callback();
    };
    return VideoCenterServer;
}());
exports = module.exports = VideoCenterServer;
//# sourceMappingURL=video-center-3.4-server.js.map