import { Body, Controller, Param, Post } from '@nestjs/common';
import { NotificationDto } from './dto';
import { FirebaseService } from './firebase.service';

@Controller('/api/v1/notifications')
export class FirebaseController {

    constructor(private service: FirebaseService) {}

    @Post('token')
    async sendToToken(@Body() { token, dto } : { token: string; dto: NotificationDto }) {
        await this.service.sendToTokens([token], dto);
        return { message: 'Notifications service is up and running!' };
    }
    @Post('topic/:topic')
    async sendToTopic(@Param('topic') topic: string, @Body() dto: NotificationDto) {
        await this.service.sendToTopic(topic, dto);
        return { message: 'Notifications service is up and running!' };
    }
}
