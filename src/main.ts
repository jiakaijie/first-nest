import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { AuthInterceptor } from './utils/lanjieqi';

// export function logger(req, res, next) {
//   next();
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(logger);
  // app.useGlobalInterceptors(new AuthInterceptor());
  await app.listen(3000);
}
bootstrap();
