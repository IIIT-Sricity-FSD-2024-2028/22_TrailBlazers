"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, role',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('WEvents API')
        .setDescription(`
## Event Management System REST API

This API powers the WEvents platform, supporting **five distinct roles** in a clear hierarchy:

| Role | Header Value | Hierarchy | Description |
|------|-------------|-----------|-------------|
| **superuser** | \`role: superuser\` | 🔴 Top | Platform Administrator — unrestricted access to ALL endpoints |
| **eventmanager** | \`role: eventmanager\` | 🟠 2nd | Event Manager — full CRUD on events, approves/rejects requests |
| **client** | \`role: client\` | 🟡 3rd | Client — creates events, manages polls, answers attendee Q&A |
| **osc** | \`role: osc\` | 🟢 4th | On-Site Coordinator — manages team, scanner, reports for assigned event |
| **attendee** | \`role: attendee\` | 🔵 5th | Attendee — browse events, RSVP, ask questions, vote on polls |

### Role Privilege Summary
- **superuser**: Bypasses all role checks — can call any API regardless of the roles listed
- **eventmanager**: Full event lifecycle management, user management, request approvals
- **client**: Create events, manage polls, answer attendee questions, view event interactions
- **osc**: Team management, check-in scanning, notifications for their assigned event
- **attendee**: Browse events, RSVP, submit questions, vote on polls

### Authentication
All protected endpoints require a **\`role\`** header. Pass the role string directly in the request header:
\`\`\`
role: eventmanager
\`\`\`

### New in v2.0
- 🆕 **Polls API** (\`/polls\`): Client creates polls, attendees vote, results with percentages
- 🆕 **Q&A API** (\`/qna\`): Attendees ask questions, client/eventmanager answers them
- 🆕 **client** role: Creates events, polls, and manages event interactions
- 🔄 **superuser** renamed to **eventmanager** (superuser is now platform-level)
- 🔄 **enduser** renamed to **attendee**

### Data Management
All data is managed **in-memory** (no external database). Data resets when the server restarts.
      `)
        .setVersion('2.0')
        .addApiKey({ type: 'apiKey', name: 'role', in: 'header', description: 'User role (superuser | eventmanager | client | osc | attendee)' }, 'role-header')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const fs = require('fs');
    const path = require('path');
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(docsDir, 'swagger.json'), JSON.stringify(document, null, 2));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`\n🚀 WEvents Backend running on: http://localhost:${port}`);
    console.log(`📚 Swagger API Docs: http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map