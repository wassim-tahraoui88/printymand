import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {

    private onlineUsers = new Map<number, number>();

    onUserConnected(userId: number) {
        this.onlineUsers.set(userId, (this.onlineUsers.get(userId) || 0) + 1);
        console.log(`User ${userId} connected, total connections: ${this.onlineUsers.get(userId)}`);
    }
    onUserDisconnected(userId: number) {
        const count = (this.onlineUsers.get(userId) || 1) - 1;
        if (count <= 0) this.onlineUsers.delete(userId);
        else this.onlineUsers.set(userId, count);
        console.log(`User ${userId} disconnected, total connections: ${this.onlineUsers.get(userId) || 0}`);
    }

    isOnline(userId: number) {
        return this.onlineUsers.has(userId);
    }
}