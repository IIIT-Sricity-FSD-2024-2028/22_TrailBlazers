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
exports.RsvpsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rsvps_service_1 = require("./rsvps.service");
const rsvp_dto_1 = require("./dto/rsvp.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let RsvpsController = class RsvpsController {
    rsvpsService;
    constructor(rsvpsService) {
        this.rsvpsService = rsvpsService;
    }
    findAll(eventId, status) {
        return this.rsvpsService.findAll(eventId, status);
    }
    findMyRsvps(email) {
        return this.rsvpsService.findByEmail(email);
    }
    findOne(id) {
        return this.rsvpsService.findOne(id);
    }
    create(dto) {
        return this.rsvpsService.create(dto);
    }
    update(id, dto) {
        return this.rsvpsService.update(id, dto);
    }
    checkIn(ticketCode) {
        return this.rsvpsService.checkIn(ticketCode);
    }
    remove(id) {
        return this.rsvpsService.remove(id);
    }
};
exports.RsvpsController = RsvpsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get all RSVPs', description: 'Accessible by superuser, eventmanager, client, and OSC.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'eventId', required: false, description: 'Filter by event ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['pending', 'confirmed', 'cancelled', 'attended'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'RSVP list' }),
    __param(0, (0, common_1.Query)('eventId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RsvpsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: "Get my RSVPs by email", description: 'Attendee fetches their own RSVPs by email query param.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' }),
    (0, swagger_1.ApiQuery)({ name: 'email', required: true, description: 'Attendee email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User RSVPs' }),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RsvpsController.prototype, "findMyRsvps", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC, role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Get RSVP by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'RSVP ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'RSVP details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'RSVP not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RsvpsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Create RSVP (Register for an event)', description: 'Attendee registers for an event. Phone must be exactly 10 digits.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'RSVP created — returns ticket code' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or invalid phone' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already registered for this event' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rsvp_dto_1.CreateRsvpDto]),
    __metadata("design:returntype", void 0)
], RsvpsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC, role_enum_1.Role.ATTENDEE),
    (0, swagger_1.ApiOperation)({ summary: 'Update RSVP status', description: 'Update RSVP details or status. Attendees can cancel their own; OSC/eventmanager/client can update any.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'RSVP ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'RSVP updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rsvp_dto_1.UpdateRsvpDto]),
    __metadata("design:returntype", void 0)
], RsvpsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('checkin/:ticketCode'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.OSC, role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Check-in attendee by ticket code', description: 'OSC scanner endpoint — validates and marks ticket as attended.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | osc | eventmanager | client', required: true, example: 'osc' }),
    (0, swagger_1.ApiParam)({ name: 'ticketCode', description: 'Ticket code (e.g. TKT00001)', example: 'TKT00001' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Check-in successful' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invalid ticket' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already checked in' }),
    __param(0, (0, common_1.Param)('ticketCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RsvpsController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.ATTENDEE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel / delete RSVP' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | attendee', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'RSVP ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'RSVP cancelled' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RsvpsController.prototype, "remove", null);
exports.RsvpsController = RsvpsController = __decorate([
    (0, swagger_1.ApiTags)('RSVPs'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('rsvps'),
    __metadata("design:paramtypes", [rsvps_service_1.RsvpsService])
], RsvpsController);
//# sourceMappingURL=rsvps.controller.js.map