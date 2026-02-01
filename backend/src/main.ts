import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SuccessInterceptor } from './common/interceptors/success.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // global exception filter for error handling
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // global response interceptor for consistent success responses
  app.useGlobalInterceptors(new SuccessInterceptor());

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://online-assessment-1-7tlz.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running : ${port}`);
}
bootstrap();
