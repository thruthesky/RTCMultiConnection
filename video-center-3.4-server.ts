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
    public users = {} as User;
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
        socket.on('user-list', ( callback:any ) => {
            // this.joinLobby( socket, callback ); 
            console.log( this.users );
            callback( this.users );           
        } );
        socket.on('join-lobby', ( callback:any ) => {
            this.joinLobby( socket, callback );            
        } );
        socket.on('join-room', ( roomname:string, callback:any ) => {
            this.joinRoom( socket, roomname, callback );            
        } );
        socket.on('update-username', ( username: string, callback:any ) => {
            this.updateUsername( socket, username, callback );            
        } );
        socket.on('create-room', ( roomname: string, callback:any ) => {
            this.createRoom( socket, roomname, callback );
        } );
        socket.on('chat-message', ( message: string, callback:any ) => {
            console.log('chat-message. callback: ', callback);
            console.log( message );
            this.chatMessage( io, socket, message, callback );            
        } );
        socket.on('leave-room', ( callback: any ) => {
            this.leaveRoom( socket, callback );
        } ); 
        socket.on('log-out', ( callback: any ) => {
            this.logout( socket, callback );
        } );
        socket.on('user-list', ( callback: any ) => {
             console.log( 'callback:', callback);
             this.userList( socket, callback );
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
        this.users[ socket.id ] = user;         
        return this.users[ socket.id ];
    }

    private setUser ( user: User ) : User {
        this.users[ user.socket ] = user;
        return this.users[ user.socket ];
    }
    
    private getUser ( socket: any ) : User {
        return this.users[ socket.id ]
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
    private leaveRoom ( socket: any, callback: any ) : void {
        var user = this.getUser( socket );        
        socket.leave( user.room );           
        console.log(user.name + ' leave the room: '+ user.room );                 
        callback();      
    }
    private chatMessage ( io:any, socket: any, message: string, callback: any ) : void {
        let user = this.getUser( socket );        
        io.sockets["in"]( user.room ).emit('chat-message', { message: message, name: user.name, room: user.room } );
        callback( user );
    }
    
    private removeUser ( id: string ) : void {
        delete this.users[ id ]
    } 

    private joinLobby ( socket: any,  callback: any ) : void {   
        var user = this.getUser( socket );  
        user.room = lobbyRoomName;
        this.setUser( user );         
        socket.join( lobbyRoomName ); 
        callback();
    }
     private joinRoom ( socket: any, roomname : string , callback: any ) : void {   
        var user = this.getUser( socket );  
        user.room = roomname;
        this.setUser( user );         
        socket.join( roomname ); 
        callback();
    }

    private userList( socket: any, callback: any ) {

        callback( JSON.stringify( this.users ) );

    }

 
}
exports = module.exports = VideoCenterServer;
