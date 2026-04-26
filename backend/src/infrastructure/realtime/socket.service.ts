import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {

    private server: Server;

    constructor() {}
    setServer(server: Server) {
        this.server = server;
    }

    emitToUser(userId: number, event: string, payload: any) {
        if (!this.server) return;
        this.server.to(`user:${userId}`).emit(event, payload);
    }
    emitToConversation(conversationId: number, event: string, payload: any) {
        if (!this.server) return;
        this.server.to(`conversation:${conversationId}`).emit(event, payload);
    }

}