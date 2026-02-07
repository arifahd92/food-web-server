import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Food Delivery API')
    .setDescription(
      `API documentation for the Food Delivery application.\n\n` +
      `**Note**: Real-time order updates are handled via Socket.IO events (joinOrderRoom, orderStatusUpdated), not REST endpoints.`,
    )
    .setVersion('1.0')
    .addTag('Menu', 'Menu management endpoints')
    .addTag('Orders', 'Order processing and tracking endpoints')
    .addTag('Admin', 'Administrative endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
