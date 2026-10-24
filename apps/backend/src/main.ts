import 'reflect-metadata';
import {Logger, ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    app.enableShutdownHooks();
    app.enableCors({origin: config.getOrThrow<string>('CORS_ORIGIN')});
    app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
    const port = config.getOrThrow<number>('PORT');
    await app.listen(port);
    Logger.log(`Listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();