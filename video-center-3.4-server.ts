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
        } );
        socket.on('join-lobby', ( callback:any ) => {
            this.joinLobby( socket, callback );
            
        } );
        socket.on('update-username', ( username: string, callback:any ) => {
            this.updateUsername( socket, username, callback );
            
        } );
        socket.on('create-room', ( roomname: string, callback:any ) => {
            this.createRoom( socket, roomname, callback );
            
        } );
        socket.on('send-message', ( message: string, callback:any ) => {
            this.sendMessage( io, socket, message, callback );
            
        } );
        socket.on('log-out', ( callback: any ) => {
            this.logout( socket, callback );
        } ); 
    }
    
    private pong ( callback: any ) {
        console.log("I got ping. pong it.");
        callback('pong');
    }

    private disconnect ( socket:any ) : void {        
        this.removeUser( socket.id );
        console.log("Someone Disconnected.");   
        // vc.io.sockets.emit('disconnect', socket.id);      
    }

    private logout ( socket: any, callback: any ) : void {
        var user = this.getUser( socket );        
        socket.leave( user.room );     
        // vc.io.sockets.emit('log-out', socket);
        this.removeUser( socket );
        console.log(user.name + ' has logged out.' );              
        callback();
    }

    private addUser ( socket: any ) : User {
        let user: User = <User>{};
        user.name = 'Anonymous';
        user.room = lobbyRoomName;
        user.socket = socket.id;
        this.Users[ socket.id ] = user;         
        return this.Users[ socket.id ];
    }

    private setUser ( user: User ) : User {
        this.Users[ user.socket ] = user;
        return this.Users[ user.socket ];
    }
    
    private getUser ( socket: any ) : User {
        return this.Users[ socket.id ]
    }
    private setUsername ( socket: any, username: string ) : User {
        let user = this.getUser( socket );
        user.name = username;
        return this.setUser( user );
    }

    private updateUsername ( socket: any, username: string, callback: any ) : void {
        let user_info = this.getUser( socket );  
        let oldusername = user_info.name;
        let user = this.setUsername( socket, username );            
        console.log(oldusername + " change it's name to "+username);    
        callback( username );
        // vc.io.sockets.emit('update-username', user );
    }
    private createRoom ( socket: any, roomname: string, callback: any ) : void {
        let user = this.getUser( socket );  
        socket.leave( user.room );
        console.log(user.name + "left :" + user.room );
        user.room = roomname;
        this.setUser( user );
        console.log( user.name + ' created and joined :' + user.room );
        callback( user.room );
        // vc.io.sockets.emit('create-room', user );
    }

    private sendMessage ( io:any, socket: any, message: string, callback: any ) : void {
        let user = this.getUser( socket );        
        io.sockets["in"]( user.room ).emit('get-message', { message: message, name: user.name, room: user.room } );  
        callback( message );
      
    }
    
    private removeUser ( id: string ) : void {
        delete this.Users[ id ]
    } 

    private joinLobby ( socket: any,  callback: any ) : void {        
        socket.join( lobbyRoomName ); 
        callback();
    }
}
exports = module.exports = VideoCenterServer;
