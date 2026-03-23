import { Injectable } from '@nestjs/common';

@Injectable()
export class PushService {

    async sendPush(userId: number, payload: any) {
        console.log(`[Push] Sending push to user ${userId}:`, payload);
        // TODO: Implement FCM here...
    }
}