"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notifications_service_1 = require("./notifications.service");
const notification_dto_1 = require("./dto/notification.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let NotificationsController = class NotificationsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(eventId, isRead) {
        return this.service.findAll(eventId, isRead);
    }
    getUnreadCount() {
        return this.service.getUnreadCount();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(dto) {
        return this.service.create(dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    resolve(id) {
        return this.service.resolve(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get all notifications' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'eventId', required: false, description: 'Filter by event' }),
    (0, swagger_1.ApiQuery)({ name: 'isRead', required: false, description: 'Filter by read status (true/false)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications list' }),
    __param(0, (0, common_1.Query)('eventId')),
    __param(1, (0, common_1.Query)('isRead')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread notification count' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Unread count' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.OSC, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Create notification / report issue', description: 'OSC staff or client reports an issue; creates a notification for eventmanager.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | osc | eventmanager | client', required: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notification created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.CreateNotificationDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification (mark read / resolve)' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_dto_1.UpdateNotificationDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a notification' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification resolved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "resolve", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete notification' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "remove", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map