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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateUserDto {
    name;
    email;
    role;
    domain;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rajesh Kumar', description: 'Full name of the user' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'rajesh@gmail.com', description: 'Unique email address' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eventmanager', enum: ['superuser', 'eventmanager', 'client', 'osc', 'attendee'], description: 'User role' }),
    (0, class_validator_1.IsIn)(['superuser', 'eventmanager', 'client', 'osc', 'attendee']),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Tech Conferences', description: 'Domain (applicable for eventmanager and client)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "domain", void 0);
class UpdateUserDto {
    name;
    email;
    role;
    domain;
    status;
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Rajesh Kumar Updated' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'rajesh.new@gmail.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'attendee', enum: ['superuser', 'eventmanager', 'client', 'osc', 'attendee'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['superuser', 'eventmanager', 'client', 'osc', 'attendee']),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Marketing Events' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'active', enum: ['active', 'inactive', 'suspended'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'inactive', 'suspended']),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "status", void 0);
//# sourceMappingURL=user.dto.js.map