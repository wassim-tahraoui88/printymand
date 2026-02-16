import { ClassSerializerInterceptor, Module, ExecutionContext } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpExceptionFilter, InternalExceptionFilter, ThrottlerExceptionFilter } from './common/filters';
import { LoggerInterceptor } from './common/interceptors';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                process.env.NODE_ENV === 'production'
                    ? '.env.production'
                    : '.env.development'
            ],
        }),
        CacheModule.register({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                throttlers: [
                    {
                        name: 'short',
                        ttl: configService.get<number>('THROTTLE_TTL_SHORT')!,
                        limit: configService.get<number>('THROTTLE_LIMIT_SHORT')!,
                        blockDuration: Number(configService.get<number>('THROTTLE_BLOCK_DURATION_SHORT')),
                    },
                    {
                        name: 'medium',
                        ttl: configService.get<number>('THROTTLE_TTL_MEDIUM')!,
                        limit: configService.get<number>('THROTTLE_LIMIT_MEDIUM')!,
                        blockDuration: Number(configService.get<number>('THROTTLE_BLOCK_DURATION_MEDIUM')),
                    },
                    {
                        name: 'long',
                        ttl: configService.get<number>('THROTTLE_TTL_LONG')!,
                        limit: configService.get<number>('THROTTLE_LIMIT_LONG')!,
                        blockDuration: Number(configService.get<number>('THROTTLE_BLOCK_DURATION_LONG')),
                    },
                ],
                errorMessage: (ctx : ExecutionContext, details : ThrottlerLimitDetail) => `Too many requests - Please try again later in ${ details.timeToBlockExpire } seconds.`,
            }),
        }),
        ScheduleModule.forRoot(),
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggerInterceptor
        },
        {
            provide: APP_FILTER,
            useClass: ThrottlerExceptionFilter
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter
        },
        {
            provide: APP_FILTER,
            useClass: InternalExceptionFilter
        }
    ],
})
export class AppModule {}
