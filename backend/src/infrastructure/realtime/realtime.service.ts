import { Injectable } from '@nestjs/common';
import { SocketService } from './socket.service';
import { PushService } from './push.service';
import { PresenceService } from './presence.service';
import { Server } from 'socket.io';
import { PostgresService } from '../persistence/postgres.service';

export class RealtimeInitDto {
    server: Server;
}

@Injectable()
export class RealtimeService {

    constructor(private readonly presence: PresenceService,
                private readonly socket: SocketService,
                private readonly push: PushService,
                private readonly db: PostgresService) {}

    init(dto: RealtimeInitDto) {
        this.socket.setServer(dto.server);
    }

    onUserConnected(userId: number) {
        this.presence.onUserConnected(userId);
    }
    onUserDisconnected(userId: number) {
        this.presence.onUserDisconnected(userId);
    }

    async emitToUser(userId: number, event: string, payload: any) {
        console.log(`[Realtime] Sending user ${userId}:`, payload);
        if (this.presence.isOnline(userId)) this.socket.emitToUser(userId, event, payload);
        else await this.push.sendPush(userId, { event, payload });
    }
    async emitToSchool(schoolId: number, event: string, payload: any) {
        const { rows } = await this.db.query(`SELECT u.id FROM users u JOIN school_memberships sm ON u.id = sm.user_id WHERE sm.school_id = $1`, [schoolId]);
        if (rows.length === 0) return;
        rows.forEach(row => this.emitToUser(row.id, event, payload));
    }
}