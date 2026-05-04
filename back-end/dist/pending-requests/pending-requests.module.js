"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const pending_requests_controller_1 = require("./pending-requests.controller");
const pending_requests_service_1 = require("./pending-requests.service");
let PendingRequestsModule = class PendingRequestsModule {
};
exports.PendingRequestsModule = PendingRequestsModule;
exports.PendingRequestsModule = PendingRequestsModule = __decorate([
    (0, common_1.Module)({
        controllers: [pending_requests_controller_1.PendingRequestsController],
        providers: [pending_requests_service_1.PendingRequestsService],
        exports: [pending_requests_service_1.PendingRequestsService],
    })
], PendingRequestsModule);
//# sourceMappingURL=pending-requests.module.js.map