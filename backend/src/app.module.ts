import { ClassSerializerInterceptor, Module, ExecutionContext } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { GlobalExceptionFilter, AppExceptionFilter, ThrottlerExceptionFilter } from './api/filters';
import { LoggerInterceptor } from './api/interceptors';
import { AuthModule } from './infrastructure/auth/auth.module';
import { PersistenceModule } from './infrastructure/persistence/persistence.module';
import { HealthModule, AuthModule as UserAuthModule, DashboardModule, ProductsModule, DesignsModule, OrdersModule } from './modules';
import { GlobalHttpValidationPipe } from './shared/validators/global-validation.pipe';

@Module({
    imports: [
	    ConfigModule.forRoot({
		    isGlobal: true,
		    envFilePath: [`.env.${process.env.NODE_ENV?.trim() || 'development'}`],
	    }),
        CacheModule.register({ isGlobal: true }),
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
	    NestScheduleModule.forRoot(),
	    PersistenceModule,
	    HealthModule,
	    AuthModule,
	    UserAuthModule,
	    DashboardModule,
	    ProductsModule,
	    DesignsModule,
	    OrdersModule,
    ],
	providers: [
		{
			provide: APP_PIPE,
			useClass: GlobalHttpValidationPipe
		},
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
			useClass: GlobalExceptionFilter
		},
		{
			provide: APP_FILTER,
			useClass: AppExceptionFilter
		},
		{
			provide: APP_FILTER,
			useClass: ThrottlerExceptionFilter
		},
	],
})
export class AppModule {}
