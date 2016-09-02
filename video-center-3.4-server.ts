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
const EmptyRoomname = '';


class VideoCenterServer {
    private io: any;
    public users: User = <User>{};
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
        socket.on('user-list', ( roomname: string, callback: any ) => {    
             this.userList( socket, roomname, callback );
        } );
        socket.on('room-list', ( callback: any ) => {    
             this.roomList( io, socket, callback );
        } );
        socket.on('broadcast-leave', ( roomname: string, callback: any ) => {    
             this.broadcastLeave( socket, roomname, callback );
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
        io.sockets.emit('disconnect', user, user.room );   
        // let message : string = user.name + " left the " + user.room + " room.";
        // this.io.sockets["in"]( user.room ).emit('chat-message', { message: message, name: "", room: user.room } );  
    }

    private logout ( io:any, socket: any, callback: any ) : void {
        var user = this.getUser( socket );        
        socket.leave( user.room ); 
        io.sockets.emit('log-out', user );
        user.room = EmptyRoomname;
        this.setUser(user);
        this.removeUser( socket );
        console.log(user.name + ' has logged out.' );              
        callback();
    }
   
    private addUser ( socket: any ) : User {
        let user: User = <User>{};
        user.name = 'Anonymous';
        user.room = EmptyRoomname;
        user.socket = socket.id;
        this.users[ socket.id ] = user;         
        return this.users[ socket.id ];
    }

    private setUser ( user: User ) : User {
        this.users[ user.socket ] = user;
        return this.users[ user.socket ];
    }
    
    //
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

    /**
     * 
     * @attention This does not create a room. There is no such thing like creating a room in socket.io
     * @note but we do here to check every thing is okay to create a room.
     *      for instance, if a room is already created with the same roomname, we will send a failure message to user.
     */
    private createRoom ( io:any, socket: any, roomname: string, callback: any ) : void {
        let user = this.getUser( socket );  
        socket.leave( user.room );
        console.log(user.name + "left :" + user.room );    
        console.log( user.name + ' created and joined :' + roomname  );
        callback( roomname );           
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
        io.sockets["in"]( user.room ).emit('chat-message', { message: message, name: user.name+":", room: user.room } );
        callback( user );
    }
    private broadcastLeave ( socket: any, roomname : string , callback: any ) : void {   
        var user = this.getUser( socket );  
        let message : string = user.name + " left the " + roomname+ " room.";
        this.io.sockets["in"]( roomname ).emit('chat-message', { message: message, name: "", room: roomname } );  
    }
    private removeUser ( id: string ) : void {
        delete this.users[ id ]
    } 

    private joinRoom ( socket: any, roomname : string , callback: any ) : void {   
        var user = this.getUser( socket );  
        user.room = roomname;
        this.setUser( user );         
        socket.join( roomname ); 
        callback( roomname );
        this.io.sockets.emit('join-room', user );    
        let message : string = user.name + " join the " + roomname + " room.";
        this.io.sockets["in"]( roomname ).emit('chat-message', { message: message, name: "", room: roomname } );  
    }

    private userList( socket: any, roomname: string,  callback: any ) {                      
        if ( roomname ) {
            /**
             * @attention I can use 'this.user' but i did it for experimental.
             * 
             */
            let users = this.get_room_users( this.io, roomname );
            callback( users );
        }
        else {
            callback ( this.users );
        }
        
    }
    private roomList( io:any, socket: any, callback: any ) {        
        callback(  this.get_room_list(io)  );
    }
    /**
     * @warning there is a bug in this method.
     * 
     *  when room='Lobby' and user=true,
     *  it should return room 'Lobby' information together with Users of 'Lobby' room.
     * 
     *  But it returns all the room with the users of the room.
     * 
     *      - if room='Talk' and users=false, then returns 'Talk' as string.
     *      - if room=undefined and users=true, then returns all the room with its users.
     *      - if room='Talk' and users=true,  then returns all the room with its users.
     * 
     * @note if you want to get users of a room, use get_room_users()
     */
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
                    var id = room[ socket_id ]; 
                    users.push( this.getUser( { id: id } ) );
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
        roomname = '/' + roomname;
        return rooms[roomname];
    }

 
}
exports = module.exports = VideoCenterServer;
