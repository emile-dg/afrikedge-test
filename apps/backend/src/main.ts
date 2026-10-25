import 'reflect-metadata';
import {Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    app.enableShutdownHooks();
    app.enableCors({origin: config.getOrThrow<string>('CORS_ORIGIN')});
    const documentation = new DocumentBuilder()
        .setTitle('AfrikEdge Transport Planning API')
        .setDescription('Transport planning API. Use diane (dispatcher) or eric (logistics manager) as X-User-Id. Only eric can validate transports.')
        .setVersion('1.0')
        .addApiKey({type: 'apiKey', in: 'header', name: 'X-User-Id'}, 'user-id')
        .addSecurityRequirements('user-id')
        .build();
    SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, documentation), {
        swaggerOptions: {persistAuthorization: true},
    });
    const port = config.getOrThrow<number>('PORT');
    await app.listen(port);
    Logger.log(`Listening on http://localhost:${port}`, 'Bootstrap');
    Logger.log(`Swagger documentation: http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
