import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MulterExceptionFilter } from './common/multer-exception.filter';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Authenticated JSON APIs should never be HTTP-cached. Express ETags otherwise
  // make Android OkHttp revalidate GETs as 304 Not Modified.
  app.set('etag', false);
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalFilters(new MulterExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
