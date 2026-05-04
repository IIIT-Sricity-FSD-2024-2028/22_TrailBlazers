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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const events_service_1 = require("./events.service");
const event_dto_1 = require("./dto/event.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let EventsController = class EventsController {
    eventsService;
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    findAll(status, managerId) {
        return this.eventsService.findAll(status, managerId);
    }
    getDashboardStats(managerId) {
        return this.eventsService.getDashboardStats(managerId);
    }
    findOne(id) {
        return this.eventsService.findOne(id);
    }
    create(dto) {
        return this.eventsService.create(dto);
    }
    update(id, dto) {
        return this.eventsService.update(id, dto);
    }
    patch(id, dto) {
        return this.eventsService.update(id, dto);
    }
    remove(id) {
        return this.eventsService.remove(id);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.ATTENDEE, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get all events', description: 'Retrieve a list of all events. Supports filtering by status and managerId. Accessible by eventmanager, client, osc, attendee, superuser.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'User role (superuser | eventmanager | client | osc | attendee)', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status. Omit or leave empty to return all events.', enum: ['pending', 'upcoming', 'live', 'completed'] }),
    (0, swagger_1.ApiQuery)({ name: 'managerId', required: false, description: 'Filter by manager user ID (e.g. u1, u2). Pass a user ID, not a role name.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of events returned successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid role header' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('managerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats/dashboard'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics', description: 'Returns aggregate stats: total events, RSVPs, ratings, engagement scores.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'User role (superuser | eventmanager | client | osc)', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'managerId', required: false, description: 'Filter stats for a specific manager' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard stats returned' }),
    __param(0, (0, common_1.Query)('managerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.ATTENDEE, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get event by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'User role (superuser | eventmanager | client | osc | attendee)', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Event ID (e.g. e1)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event returned' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new event', description: 'Accessible by eventmanager and client. Superuser can also create events.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only eventmanager or client can create events' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_dto_1.CreateEventDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Update event (full replace)', description: 'Full update of an event. Eventmanager and client only.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Event ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_dto_1.UpdateEventDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Partially update event', description: 'Update specific fields. Eventmanager and client only. Use for status changes (e.g. pending → live).' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Event ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event patched' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_dto_1.UpdateEventDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete event', description: 'Permanently remove an event. Eventmanager only (or superuser).' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Event ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "remove", null);
exports.EventsController = EventsController = __decorate([
    (0, swagger_1.ApiTags)('Events'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map