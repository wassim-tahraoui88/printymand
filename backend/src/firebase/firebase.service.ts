import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';
import { NotificationDto } from './dto';

@Injectable()
export class FirebaseService implements OnModuleInit {

    private readonly logger = new Logger(FirebaseService.name);
    private messaging: admin.messaging.Messaging;

    onModuleInit() {
        return;
        if (admin.apps.length > 0) {
            this.messaging = admin.messaging();
            this.logger.log('Firebase Admin SDK already initialized');
            return;
        }
        const serviceAccountPath = path.join(process.cwd(), 'resources', 'firebase-credentials.json');
        const credentials = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(credentials) });

        this.messaging = admin.messaging();
        this.logger.log('Initialized Firebase Admin SDK');
    }

    async sendToToken(token: string, notification: NotificationDto) {
        return;
        const response = await this.messaging.send({ token, data: { someData: "Some Value"}});// notification: { title: "Test Notif", body : "This is a test message notification" } });
        this.logger.log(`Successfully sent message to token ${token}: ${response}`);
        return response;
    }
    async sendToTokens(tokens: string[], notification: NotificationDto) {
        return;
        try {
            const response = await this.messaging.sendEachForMulticast({ tokens, data: { someData: "Some Value" }}); //tokens, notification: { title: "Test Notif", body : "This is a test message notification" } });
            if (response.successCount > 0) this.logger.log(`Successfully sent message to ${ response.successCount } devices.`);
            if (response.failureCount > 0) this.logger.error(`Failed to send message to ${ response.failureCount } devices.`);
        }
        catch (error) {
            this.logger.error('Error sending push notification', error);
        }
    }
    async sendToTopic(topic: string, notification: NotificationDto) {
        return;
        const response = await this.messaging.send({ topic, notification });
        this.logger.log(`Successfully sent message to topic ${topic}: ${response}`);
        return response;
    }
}
