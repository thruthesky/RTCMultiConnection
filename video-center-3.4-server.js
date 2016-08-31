var lobbyRoomName = 'Lobby';
var VideoCenterServer = (function () {
    function VideoCenterServer() {
        this.users = {};
        console.log("VideoCenterServer::constructor() ...");
    }
    VideoCenterServer.prototype.listen = function (socket, io) {
        var _this = this;
        console.log('Someone Connected.');
        this.io = io;
        this.addUser(socket);
        socket.on('disconnect', function () {
            _this.disconnect(io, socket);
        });
        socket.on('join-lobby', function (callback) {
            _this.joinLobby(socket, callback);
        });
        socket.on('join-room', function (roomname, callback) {
            _this.joinRoom(socket, roomname, callback);
        });
        socket.on('update-username', function (username, callback) {
            _this.updateUsername(io, socket, username, callback);
        });
        socket.on('create-room', function (roomname, callback) {
            _this.createRoom(io, socket, roomname, callback);
        });
        socket.on('chat-message', function (message, callback) {
            _this.chatMessage(io, socket, message, callback);
        });
        socket.on('leave-room', function (callback) {
            _this.leaveRoom(socket, callback);
        });
        socket.on('log-out', function (callback) {
            _this.logout(io, socket, callback);
        });
        socket.on('user-list', function (callback) {
            _this.userList(socket, callback);
        });
    };
    VideoCenterServer.prototype.pong = function (callback) {
        console.log("I got ping. pong it.");
        callback('pong');
    };
    VideoCenterServer.prototype.disconnect = function (io, socket) {
        this.removeUser(socket.id);
        console.log("Someone Disconnected.");
        io.sockets.emit('disconnect', socket.id);
    };
    VideoCenterServer.prototype.logout = function (io, socket, callback) {
        var user = this.getUser(socket);
        socket.leave(user.room);
        io.sockets.emit('log-out', user.socket);
        this.removeUser(socket);
        console.log(user.name + ' has logged out.');
        callback();
    };
    VideoCenterServer.prototype.addUser = function (socket) {
        var user = {};
        user.name = 'Anonymous';
        user.room = lobbyRoomName;
        user.socket = socket.id;
        this.users[socket.id] = user;
        return this.users[socket.id];
    };
    VideoCenterServer.prototype.setUser = function (user) {
        this.users[user.socket] = user;
        return this.users[user.socket];
    };
    VideoCenterServer.prototype.getUser = function (socket) {
        return this.users[socket.id];
    };
    VideoCenterServer.prototype.setUsername = function (socket, username) {
        var user = this.getUser(socket);
        user.name = username;
        return this.setUser(user);
    };
    VideoCenterServer.prototype.updateUsername = function (io, socket, username, callback) {
        var user_info = this.getUser(socket);
        var oldusername = user_info.name;
        var user = this.setUsername(socket, username);
        console.log(oldusername + " change it's name to " + username);
        callback(username);
        io.sockets.emit('update-username', user_info);
    };
    VideoCenterServer.prototype.createRoom = function (io, socket, roomname, callback) {
        var user = this.getUser(socket);
        socket.leave(user.room);
        console.log(user.name + "left :" + user.room);
        user.room = roomname;
        this.setUser(user);
        console.log(user.name + ' created and joined :' + user.room);
        callback(user.room);
        io.sockets.emit('create-room', user);
    };
    VideoCenterServer.prototype.leaveRoom = function (socket, callback) {
        var user = this.getUser(socket);
        socket.leave(user.room);
        console.log(user.name + ' leave the room: ' + user.room);
        callback();
    };
    VideoCenterServer.prototype.chatMessage = function (io, socket, message, callback) {
        var user = this.getUser(socket);
        io.sockets["in"](user.room).emit('chat-message', { message: message, name: user.name, room: user.room });
        callback(user);
    };
    VideoCenterServer.prototype.removeUser = function (id) {
        delete this.users[id];
    };
    VideoCenterServer.prototype.joinLobby = function (socket, callback) {
        var user = this.getUser(socket);
        user.room = lobbyRoomName;
        this.setUser(user);
        socket.join(lobbyRoomName);
        callback();
    };
    VideoCenterServer.prototype.joinRoom = function (socket, roomname, callback) {
        var user = this.getUser(socket);
        user.room = roomname;
        this.setUser(user);
        socket.join(roomname);
        callback();
    };
    VideoCenterServer.prototype.userList = function (socket, callback) {
        callback(this.users);
    };
    return VideoCenterServer;
}());
exports = module.exports = VideoCenterServer;
//# sourceMappingURL=video-center-3.4-server.js.map