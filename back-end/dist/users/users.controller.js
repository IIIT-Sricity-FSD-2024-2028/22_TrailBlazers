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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const user_dto_1 = require("./dto/user.dto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll(role) {
        return this.usersService.findAll(role);
    }
    getStats() {
        return this.usersService.getStats();
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    create(dto) {
        return this.usersService.create(dto);
    }
    update(id, dto) {
        return this.usersService.update(id, dto);
    }
    remove(id) {
        return this.usersService.remove(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users', description: 'List all users. Eventmanager or superuser only. Optionally filter by role.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, enum: ['superuser', 'eventmanager', 'client', 'osc', 'attendee'], description: 'Filter by user role' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users list' }),
    __param(0, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID (e.g. u1)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a user', description: 'Create a new user account. Eventmanager or superuser only.' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (partial)' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EVENTMANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user' }),
    (0, swagger_1.ApiHeader)({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiSecurity)('role-header'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map