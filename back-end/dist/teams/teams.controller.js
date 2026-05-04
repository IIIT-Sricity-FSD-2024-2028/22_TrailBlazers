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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const teams_service_1 = require("./teams.service");
const team_dto_1 = require("./dto/team.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let TeamsController = class TeamsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(eventId, status) {
        return this.service.findAll(eventId, status);
    }
    getStats(eventId) {
        return this.service.getStats(eventId);
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
    remove(id) {
        return this.service.remove(id);
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get all team members' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'eventId', required: false, description: 'Filter by event' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['active', 'break', 'offline'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team members list' }),
    __param(0, (0, common_1.Query)('eventId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':eventId/stats'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get team statistics for an event' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiParam)({ name: 'eventId', description: 'Event ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team stats' }),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Team member ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Add team member to event', description: 'Assign a new OSC staff member to an event. Eventmanager or client.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Team member added' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [team_dto_1.CreateTeamMemberDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT, role_enum_1.Role.OSC),
    (0, swagger_1.ApiOperation)({ summary: 'Update team member (status, role, event)', description: 'OSC can update their own status; eventmanager/client can change any field.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Team member ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, team_dto_1.UpdateTeamMemberDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove team member from event' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Team member ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member removed' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "remove", null);
exports.TeamsController = TeamsController = __decorate([
    (0, swagger_1.ApiTags)('Teams'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('teams'),
    __metadata("design:paramtypes", [teams_service_1.TeamsService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map