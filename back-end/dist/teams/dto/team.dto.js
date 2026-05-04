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
exports.UpdateTeamMemberDto = exports.CreateTeamMemberDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateTeamMemberDto {
    name;
    email;
    teamRole;
    eventId;
}
exports.CreateTeamMemberDto = CreateTeamMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Alex Thompson', description: 'Team member name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'alex.t@wevents.com', description: 'Team member email' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Scanner Operator', enum: ['Scanner Operator', 'Coordinator', 'Manager', 'Support'], description: 'Role in the team' }),
    (0, class_validator_1.IsIn)(['Scanner Operator', 'Coordinator', 'Manager', 'Support']),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "teamRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e1', description: 'Event ID they are assigned to' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "eventId", void 0);
class UpdateTeamMemberDto {
    teamRole;
    status;
    eventId;
}
exports.UpdateTeamMemberDto = UpdateTeamMemberDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Manager', enum: ['Scanner Operator', 'Coordinator', 'Manager', 'Support'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['Scanner Operator', 'Coordinator', 'Manager', 'Support']),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "teamRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'active', enum: ['active', 'break', 'offline'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'break', 'offline']),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'e2', description: 'Re-assign to different event' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "eventId", void 0);
//# sourceMappingURL=team.dto.js.map