import { Module, Global } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { SocketService } from './socket.service';
import { RealtimeService } from './realtime.service';
import { PushService } from './push.service';

@Global()
@Module({
    providers: [
        PresenceService,
        SocketService,
        PushService,
        RealtimeService
    ],
    exports: [RealtimeService]
})
export class RealtimeModule {}