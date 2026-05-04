"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const events_module_1 = require("./events/events.module");
const users_module_1 = require("./users/users.module");
const rsvps_module_1 = require("./rsvps/rsvps.module");
const pending_requests_module_1 = require("./pending-requests/pending-requests.module");
const notifications_module_1 = require("./notifications/notifications.module");
const teams_module_1 = require("./teams/teams.module");
const polls_module_1 = require("./polls/polls.module");
const qna_module_1 = require("./qna/qna.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            events_module_1.EventsModule,
            users_module_1.UsersModule,
            rsvps_module_1.RsvpsModule,
            pending_requests_module_1.PendingRequestsModule,
            notifications_module_1.NotificationsModule,
            teams_module_1.TeamsModule,
            polls_module_1.PollsModule,
            qna_module_1.QnaModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map