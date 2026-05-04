import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all frontend origins
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, role',
  });

  // Global validation pipe — whitelist strips unknown fields but allow extra props for flex DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('WEvents API')
    .setDescription(
      `
## Event Management System REST API — v3.0

This API powers the WEvents platform based on the ER-diagram schema, supporting **five distinct roles**:

| Role | Header Value | Description |
|------|-------------|-------------|
| **superuser** | \`role: superuser\` | Platform Administrator — unrestricted access to ALL endpoints |
| **eventmanager** | \`role: eventmanager\` | Full CRUD on events, approves/rejects requests, manages teams |
| **client** | \`role: client\` | Creates events & polls, manages event interactions |
| **osc** | \`role: osc\` | On-Site Coordinator — check-in scanning, team & notifications |
| **attendee** | \`role: attendee\` | Browse events, RSVP, ask questions, vote on polls, submit feedback |

### Authentication
All endpoints require a **\`role\`** header:
\`\`\`
role: eventmanager
\`\`\`

### API Modules (ER-Diagram aligned)

| Module | Endpoint | ER Entity |
|--------|----------|-----------|
| Events | \`/events\` | Event |
| Users | \`/users\` | User / Client / EventManager / Coordinator / Attendee |
| RSVPs | \`/rsvps\` | RSVP |
| Check-Ins | \`/check-ins\` | Check_in |
| Sessions | \`/sessions\` | Session |
| Feedback | \`/feedback\` | Feedback |
| Reports | \`/reports\` | Report |
| Polls | \`/polls\` | Poll |
| Poll Responses | \`/poll-responses\` | Poll_Response |
| Q&A | \`/qna\` | Q&A interaction |
| Notifications | \`/notifications\` | Notification |
| Teams | \`/teams\` | Coordinator assignments |
| Pending Requests | \`/pending-requests\` | Client → Manager approval flow |

### Data Persistence
All data is persisted to **JSON files** in the \`data/\` directory. Changes made via Swagger survive server restarts.
      `,
    )
    .setVersion('3.0')
    .addApiKey(
      { type: 'apiKey', name: 'role', in: 'header', description: 'User role (superuser | eventmanager | client | osc | attendee)' },
      'role-header',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 WEvents Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger API Docs: http://localhost:${port}/api/docs\n`);
}
bootstrap();
