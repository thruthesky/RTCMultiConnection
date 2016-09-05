"use strict";
var extend = require('extend');
var lobbyRoomName = 'Lobby';
var EmptyRoomname = '';
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
            var user = _this.getUser(socket);
            _this.broadcastLeave(socket, user.room, function () {
                console.log("Disconnected");
            });
            _this.disconnect(io, socket);
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
            _this.leaveRoom(io, socket, callback);
        });
        socket.on('log-out', function (callback) {
            _this.logout(io, socket, callback);
        });
        socket.on('user-list', function (roomname, callback) {
            _this.userList(socket, roomname, callback);
        });
        socket.on('room-list', function (callback) {
            _this.roomList(io, socket, callback);
        });
        socket.on('broadcast-leave', function (roomname, callback) {
            _this.broadcastLeave(socket, roomname, callback);
        });
    };
    VideoCenterServer.prototype.pong = function (callback) {
        console.log("I got ping. pong it.");
        callback('pong');
    };
    VideoCenterServer.prototype.disconnect = function (io, socket) {
        var user = this.getUser(socket);
        socket.leave(user.room);
        if (user.room != "Lobby") {
            this.leaveRoom(io, socket, function () {
                console.log("You left and disconnect");
            });
        }
        this.removeUser(socket.id);
        console.log("Someone Disconnected.");
    };
    VideoCenterServer.prototype.logout = function (io, socket, callback) {
        var user = this.getUser(socket);
        socket.leave(user.room);
        io.sockets.emit('log-out', user);
        user.room = EmptyRoomname;
        this.setUser(user);
        this.removeUser(socket);
        console.log(user.name + ' has logged out.');
        callback();
    };
    VideoCenterServer.prototype.addUser = function (socket) {
        var user = {};
        user.name = 'Anonymous';
        user.room = EmptyRoomname;
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
        console.log(user.name + ' created and joined :' + roomname);
        callback(roomname);
    };
    VideoCenterServer.prototype.leaveRoom = function (io, socket, callback) {
        var user = this.getUser(socket);
        socket.leave(user.room);
        console.log(user.name + ' leave the room: ' + user.room);
        if (this.is_room_exist(io, user.room)) {
            console.log("room exists. don't broadcast for room delete");
            callback();
        }
        else if (this.get_room_users(io, user.room)) {
            console.log("user exists. don't broadcast for room delete");
            callback();
        }
        else {
            this.io.sockets.emit('remove-room', user.room);
            callback();
        }
    };
    VideoCenterServer.prototype.chatMessage = function (io, socket, message, callback) {
        var user = this.getUser(socket);
        io.sockets["in"](user.room).emit('chat-message', { message: message, name: user.name + ":", room: user.room });
        callback(user);
    };
    VideoCenterServer.prototype.broadcastLeave = function (socket, roomname, callback) {
        var user = this.getUser(socket);
        var message = user.name + " left the " + roomname + " room.";
        this.io.sockets["in"](roomname).emit('chat-message', { message: message, name: "", room: roomname });
    };
    VideoCenterServer.prototype.removeUser = function (id) {
        delete this.users[id];
    };
    VideoCenterServer.prototype.joinRoom = function (socket, roomname, callback) {
        var user = this.getUser(socket);
        user.room = roomname;
        this.setUser(user);
        socket.join(roomname);
        callback(roomname);
        this.io.sockets.emit('join-room', user);
        var message = user.name + " join the " + roomname + " room.";
        this.io.sockets["in"](roomname).emit('chat-message', { message: message, name: "", room: roomname });
    };
    VideoCenterServer.prototype.userList = function (socket, roomname, callback) {
        if (roomname) {
            var users = this.get_room_users(this.io, roomname);
            callback(users);
        }
        else {
            callback(this.users);
        }
    };
    VideoCenterServer.prototype.roomList = function (io, socket, callback) {
        callback(this.get_room_list(io));
    };
    VideoCenterServer.prototype.get_room_list = function (io, opts) {
        var defaults = {
            room: false,
            user: false
        };
        var o = extend(defaults, opts);
        var rooms = io.sockets.manager.rooms;
        var roomList = [];
        var room;
        var re;
        for (var roomname in rooms) {
            if (!rooms.hasOwnProperty(roomname))
                continue;
            if (roomname == '')
                continue;
            roomname = roomname.replace(/^\//, '');
            re = false;
            if (o.user) {
                re = {
                    roomname: roomname,
                    users: this.get_room_users(io, roomname)
                };
            }
            else {
                if (o.room == false)
                    re = roomname;
                else if (o.room == roomname)
                    re = roomname;
            }
            if (re)
                roomList.push(re);
        }
        return roomList;
    };
    VideoCenterServer.prototype.get_room_users = function (io, roomname) {
        if (this.is_room_exist(io, roomname)) {
            var room = this.get_room(io, roomname);
            if (room) {
                var users = [];
                for (var socket_id in room) {
                    if (!room.hasOwnProperty(socket_id))
                        continue;
                    var id = room[socket_id];
                    users.push(this.getUser({ id: id }));
                }
                return users;
            }
        }
        return 0;
    };
    VideoCenterServer.prototype.is_room_exist = function (io, roomname) {
        var re = this.get_room_list(io, { room: roomname });
        return re.length;
    };
    VideoCenterServer.prototype.get_room = function (io, roomname) {
        var rooms = io.sockets.manager.rooms;
        roomname = '/' + roomname;
        return rooms[roomname];
    };
    return VideoCenterServer;
}());
exports = module.exports = VideoCenterServer;
//# sourceMappingURL=video-center-3.4-server.js.map