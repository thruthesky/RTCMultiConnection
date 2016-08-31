/// <reference path="typings/globals/node/index.d.ts" />
/// <reference path="typings/globals/socket.io/index.d.ts" />
/// <reference path="typings/globals/extend/index.d.ts" />
/// import fs = require('fs');
/// import oo = require('socket.io');
import extend =require('extend');
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
            this.disconnect( io, socket );
        } );      
        socket.on('join-lobby', ( callback:any ) => {
            this.joinLobby( socket, callback );            
        } );
        socket.on('join-room', ( roomname:string, callback:any ) => {
            this.joinRoom( socket, roomname, callback );            
        } );
        socket.on('update-username', ( username: string, callback:any ) => {
            this.updateUsername( io, socket, username, callback );            
        } );
        socket.on('create-room', ( roomname: string, callback:any ) => {
            this.createRoom( io, socket, roomname, callback );
        } );
        socket.on('chat-message', ( message: string, callback:any ) => {            
            this.chatMessage( io, socket, message, callback );            
        } );
        socket.on('leave-room', ( callback: any ) => {
            this.leaveRoom( io, socket, callback );
        } ); 
        socket.on('log-out', ( callback: any ) => {
            this.logout( io, socket, callback );
        } );
        socket.on('user-list', ( callback: any ) => {    
             this.userList( socket, callback );
        } );
        socket.on('room-list', ( callback: any ) => {    
             this.roomList( io, socket, callback );
        } );
        
    }
    
    private pong ( callback: any ) {
        console.log("I got ping. pong it.");
        callback('pong');
    }

    private disconnect ( io:any, socket:any ) : void { 
        var user = this.getUser( socket );  
        socket.leave( user.room );
            if(user.room!="Lobby"){              
                this.leaveRoom(io, socket, ()=>{
                    console.log("You left and disconnect");
                });
            }               
        this.removeUser( socket.id );
        console.log("Someone Disconnected.");   
        io.sockets.emit('disconnect', socket.id );    
    }

    private logout ( io:any, socket: any, callback: any ) : void {
        var user = this.getUser( socket );        
        socket.leave( user.room );     
        // vc.io.sockets.emit('log-out', socket);
        io.sockets.emit('log-out', user.socket );
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

    private updateUsername ( io:any, socket: any, username: string, callback: any ) : void {
        let user_info = this.getUser( socket );  
        let oldusername = user_info.name;
        let user = this.setUsername( socket, username );            
        console.log(oldusername + " change it's name to "+username);    
        callback( username );        
        io.sockets.emit('update-username', user_info )
    }
    private createRoom ( io:any, socket: any, roomname: string, callback: any ) : void {
        let user = this.getUser( socket );  
        socket.leave( user.room );
        console.log(user.name + "left :" + user.room );
        user.room = roomname;
        this.setUser( user );
        console.log( user.name + ' created and joined :' + user.room );
        callback( user.room );
        io.sockets.emit('create-room', user );      
    }
    private leaveRoom ( io:any, socket: any, callback: any ) : void {
        var user = this.getUser( socket );        
        socket.leave( user.room );           
        console.log(user.name + ' leave the room: '+ user.room );     
        if ( this.is_room_exist( io, user.room ) ) {
            // room exist..
            console.log("room exists. don't broadcast for room delete");
            callback();   
        }
        else if ( this.get_room_users( io, user.room ) ) {
            // room exists...
            console.log("user exists. don't broadcast for room delete");
            callback();   
        }
        else {
            this.io.sockets.emit('remove-room', user.room );
            callback();   
        }            
           
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
        // callback( JSON.stringify( this.users ) );
        callback(  this.users  );
    }
    private roomList( io:any, socket: any, callback: any ) {        
        callback(  this.get_room_list(io)  );
    }
    private get_room_list(io:any, opts?:any) {
        var defaults = {
            room: false,
            user: false
        };
        let o:any = extend( defaults, opts );        
        var rooms = io.sockets.manager.rooms;       
        var roomList = [];
        var room;
        var re;
        for ( var roomname in rooms ) {
            if ( ! rooms.hasOwnProperty( roomname ) ) continue;
            if ( roomname == '' ) continue;
            roomname = roomname.replace( /^\//, '' );

            re = false;
            if ( o.user ) {
                re = {
                    roomname: roomname,
                    users: this.get_room_users( io, roomname )
                }
            }
            else {
                if ( o.room == false ) re = roomname;
                else if ( o.room == roomname ) re = roomname;
            }

            if ( re ) roomList.push( re );

        }
        return roomList;
    }
    private get_room_users( io:any, roomname:any ):any {     
        if ( this.is_room_exist( io, roomname ) ) {
            let room:any = this.get_room( io, roomname );
            if ( room ) {
                var users = [];
                for ( var socket_id in room ) {
                    if ( ! room.hasOwnProperty( socket_id ) ) continue;
                    var socket = room[ socket_id ]; 
                    users.push( this.getUser( socket ) );
                }
                return users;
            }
        }
        return 0;
    }
    private is_room_exist(io:any, roomname:any) {
        let re:any = this.get_room_list( io, {room: roomname} );
        return re.length;
    }
    private get_room( io:any, roomname:any) {
        let rooms:any = io.sockets.manager.rooms;
        return rooms[roomname];
    }
 
}
exports = module.exports = VideoCenterServer;
