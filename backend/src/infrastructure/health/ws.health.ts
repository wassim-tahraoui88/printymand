import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
// import { ChatGateway } from '../chat/chat.gateway'; // Assuming this is your gateway

@Injectable()
export class WebSocketHealthIndicator {

    constructor(private readonly healthIndicatorService: HealthIndicatorService,
                /*private readonly chatGateway: ChatGateway*/) {}

    async check(key: string): Promise<HealthIndicatorResult> {
        const indicator = this.healthIndicatorService.check(key);
        const server = {};

        if (!server) return indicator.down({ message: 'WebSocket server not initialized', });
        // const clientsCount = server.sockets.sockets.size;
        return indicator.up({ /*clients: clientsCount*/ })
    }
}