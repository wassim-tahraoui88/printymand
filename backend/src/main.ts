import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as qs from 'qs';
import swagger from './swagger';
import { VersioningType } from "@nestjs/common";

async function bootstrap() {
    const port = parseInt(process.env.PORT ?? "8080");
    const host = process.env.HOST || 'localhost';

    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: [ 'http://localhost:4200' ],
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With, X-Forwarded-For, Set-Cookie, Cookie',
    });

    app.use(cookieParser());
    app.getHttpAdapter().getInstance().set('query parser', (str: string) => qs.parse(str));

    swagger(app);

	// API Versioning
	app.setGlobalPrefix('api');
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '1',
	});

	await app.listen(port);

    console.log(`
==============================================================
                  Environment: ${process.env.NODE_ENV}
          Server running on: http://${host}:${port}/
      OpenAPI Specification: http://${host}:${port}/docs
==============================================================
`);
}
bootstrap();
