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
exports.PendingRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pending_requests_service_1 = require("./pending-requests.service");
const pending_request_dto_1 = require("./dto/pending-request.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let PendingRequestsController = class PendingRequestsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(status) {
        return this.service.findAll(status);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(dto) {
        return this.service.create(dto);
    }
    review(id, dto) {
        return this.service.review(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.PendingRequestsController = PendingRequestsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get all event requests', description: 'Eventmanager views all client event hosting requests.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['Pending', 'Approved', 'Rejected'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of pending requests' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PendingRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER, role_enum_1.Role.CLIENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get request by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Request ID (e.g. pr1)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Request not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PendingRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.CLIENT, role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Submit new event hosting request', description: 'Client submits a request to host an event.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'superuser | client | eventmanager', required: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Request submitted' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pending_request_dto_1.CreatePendingRequestDto]),
    __metadata("design:returntype", void 0)
], PendingRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject an event request', description: 'Eventmanager reviews a pending request. Approval requires managerId.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Request ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request reviewed' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Already reviewed or missing managerId' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pending_request_dto_1.ReviewPendingRequestDto]),
    __metadata("design:returntype", void 0)
], PendingRequestsController.prototype, "review", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete event request' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Request ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PendingRequestsController.prototype, "remove", null);
exports.PendingRequestsController = PendingRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Pending Requests'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('pending-requests'),
    __metadata("design:paramtypes", [pending_requests_service_1.PendingRequestsService])
], PendingRequestsController);
//# sourceMappingURL=pending-requests.controller.js.map