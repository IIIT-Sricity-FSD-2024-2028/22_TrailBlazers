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
exports.UpdateEventDto = exports.CreateEventDto = exports.EventStatsDto = exports.TimelineSessionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class TimelineSessionDto {
    time;
    title;
    speaker;
    location;
    duration;
    type;
}
exports.TimelineSessionDto = TimelineSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00 AM', description: 'Start time of the session' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TimelineSessionDto.prototype, "time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Keynote: Future of AI', description: 'Session title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TimelineSessionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Dr. Ananya Gupta', description: 'Speaker name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TimelineSessionDto.prototype, "speaker", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Main Auditorium', description: 'Session location' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TimelineSessionDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1 hour', description: 'Session duration' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TimelineSessionDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'keynote', description: 'Session type (keynote, panel, workshop, talk, demo, break)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TimelineSessionDto.prototype, "type", void 0);
class EventStatsDto {
    rsvps;
    checkins;
    engagement;
    rating;
    participationTrend;
    feedbackScore;
}
exports.EventStatsDto = EventStatsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 342 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EventStatsDto.prototype, "rsvps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 298 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EventStatsDto.prototype, "checkins", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 87.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EventStatsDto.prototype, "engagement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 4.8 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EventStatsDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], example: [10, 25, 45, 30, 55, 78] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], EventStatsDto.prototype, "participationTrend", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 92 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EventStatsDto.prototype, "feedbackScore", void 0);
class CreateEventDto {
    title;
    status;
    date;
    location;
    capacity;
    domain;
    description;
    managerId;
    managerName;
    timeline;
    stats;
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Global Tech Summit 2026', description: 'Event title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'upcoming',
        enum: ['pending', 'upcoming', 'live', 'completed'],
        description: 'Event status',
    }),
    (0, class_validator_1.IsIn)(['pending', 'upcoming', 'live', 'completed']),
    __metadata("design:type", String)
], CreateEventDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-15', description: 'Event date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'India Habitat Centre, New Delhi', description: 'Event location' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 500, description: 'Maximum capacity of the event' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Client Hosted Events', description: 'Event domain/category' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Explore the future of technology with industry leaders.', description: 'Event description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'u1', description: 'ID of the event manager (superuser)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rajesh Kumar', description: 'Name of the event manager' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "managerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [TimelineSessionDto], description: 'Event sessions/timeline' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TimelineSessionDto),
    __metadata("design:type", Array)
], CreateEventDto.prototype, "timeline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: EventStatsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EventStatsDto),
    __metadata("design:type", EventStatsDto)
], CreateEventDto.prototype, "stats", void 0);
class UpdateEventDto {
    title;
    status;
    date;
    location;
    capacity;
    domain;
    description;
    timeline;
    stats;
}
exports.UpdateEventDto = UpdateEventDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated Event Title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'live', enum: ['pending', 'upcoming', 'live', 'completed'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'upcoming', 'live', 'completed']),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-05-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Taj Hotel, Mumbai' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateEventDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Tech Conferences' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated description.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEventDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [TimelineSessionDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TimelineSessionDto),
    __metadata("design:type", Array)
], UpdateEventDto.prototype, "timeline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: EventStatsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EventStatsDto),
    __metadata("design:type", EventStatsDto)
], UpdateEventDto.prototype, "stats", void 0);
//# sourceMappingURL=event.dto.js.map