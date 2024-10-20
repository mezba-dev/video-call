import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = {
    key: fs.readFileSync('172.20.20.25-key.pem'),
    cert: fs.readFileSync('172.20.20.25.pem'),
  };

  const server = https.createServer(
    options,
    app.getHttpAdapter().getInstance(),
  );

  // Start listening on port 8000
  server.listen(8000, () => {
    console.log('Server is running on https://172.20.20.25:8000');
  });

  await app.init(); // Initialize NestJS application
}

bootstrap();
