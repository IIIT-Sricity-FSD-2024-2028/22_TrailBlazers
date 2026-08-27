import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Users & Identity')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires IT_SUPPORT, SUPER_ADMIN, or ADMIN)' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('IT_SUPPORT', 'SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List Users', description: 'Retrieve user accounts list (IT Support & Admin access)' })
  @ApiResponse({ status: 200, description: 'Users list returned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. IT_SUPPORT or Admin role required' })
  async getUsers() {
    return this.usersService.getAllUsers();
  }

  @Post()
  @Roles('IT_SUPPORT', 'SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create User Account', description: 'Create a new user account with role selection (IT Support User Creation Workflow)' })
  @ApiResponse({ status: 201, description: 'User created successfully with initial login credentials' })
  @ApiResponse({ status: 400, description: 'Invalid role or input parameters' })
  @ApiResponse({ status: 409, description: 'Email address already registered' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires IT_SUPPORT or Admin role' })
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.usersService.createUser(dto, req.user);
  }
}
