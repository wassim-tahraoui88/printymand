import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseController } from './firebase.controller';

@Global()
@Module({
    controllers: [FirebaseController],
    providers: [FirebaseService],
    exports: [FirebaseService]
})
export class FirebaseModule {}
