/// <reference path="typings/globals/node/index.d.ts" />
/// <reference path="typings/globals/socket.io/index.d.ts" />
/// import fs = require('fs');
/// import oo = require('socket.io');

interface User {
    name: string;
    room: string;
    socket: string; // socket id
}


const lobbyRoomName = 'Lobby';


class VideoCenterServer {
    private io: any;
    Users: Array<User> = new Array();
    constructor() {
        console.log("VideoCenterServer::constructor() ...");
    }
    /*-----Listener---*/
    listen(socket, io) {
        // console.log('VideoCenterServer::listen()');
        console.log('Someone Connected.');
        this.io = io;
        this.addUser( socket );      
        // socket.on('ping', this.pong );        
        socket.on('disconnect', () => {
            this.disconnect( socket );
        });
        socket.on('update-username', ( username, callback ) => {
            this.updateUsername( socket, username, callback );
         } );
    }
    pong ( callback ) {
        console.log("I got ping. pong it.");
        callback('pong');
    }
    disconnect ( socket:any ) : void {        
        this.removeUser( socket.id );
        console.log("Someone Disconnected.");   
        // vc.io.sockets.emit('disconnect', socket.id);      
    }
    addUser ( socket: any ) : User {
        let user: User = <User>{};
        user.name = 'Anonymous';
        user.room = lobbyRoomName;
        user.socket = socket.id;
        this.Users[ socket.id ] = user;
        return this.Users[ socket.id ];
    }
    setUser ( user: User ) : User {
        this.Users[ user.socket ] = user;
        return this.Users[ user.socket ];
    }
    
    getUser ( socket: any ) : User {
        return this.Users[ socket.id ]
    }
    setUsername ( socket: any, username: string ) : User {
        let user = this.getUser( socket );
        user.name = username;
        return this.setUser( user );
    }

    updateUsername ( socket: any, username: string, callback: any ) : void {
        let user = this.setUsername( socket, username );        
        callback( username );
        // vc.io.sockets.emit('update-username', user );
    }
    removeUser ( id: string ) : void {
        delete this.Users[ id ]
    }  
   
}
exports = module.exports = VideoCenterServer;
