import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Users')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Get all users', description: 'List all users. Eventmanager or superuser only. Optionally filter by role.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiQuery({ name: 'role', required: false, enum: ['superuser', 'eventmanager', 'client', 'osc', 'attendee'], description: 'Filter by user role' })
  @ApiResponse({ status: 200, description: 'Users list' })
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get('stats')
  @Roles(Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'User stats' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @Roles(Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'User ID (e.g. u1)' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Create a user', description: 'Create a new user account. Eventmanager or superuser only.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Update user (partial)' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.EVENTMANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
