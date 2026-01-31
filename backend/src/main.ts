import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SuccessInterceptor } from './common/interceptors/success.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global interceptor for consistent success responses
  app.useGlobalInterceptors(new SuccessInterceptor());

  // Enable CORS for frontend connections
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running : ${port}`);
}
bootstrap();
