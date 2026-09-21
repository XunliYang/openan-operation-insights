import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // 白名单 + 拒绝未知参数 + 隐式类型转换（见 03 文档 6.1）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsOrigins = config.get<string[]>('corsOrigins') ?? [];
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins, credentials: false });
  }

  app.enableShutdownHooks();

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);

  const dataDir = config.get<string>('dataDir');
  Logger.log(`OpenAN 运营洞察 API 已启动：http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`数据目录：${dataDir}`, 'Bootstrap');
}

void bootstrap();
