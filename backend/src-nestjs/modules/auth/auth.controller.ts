import {
  Controller,
  Post,
  Get,
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
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User Registration', description: 'Register a new account (CLIENT or ATTENDEE)' })
  @ApiResponse({ status: 201, description: 'User account registered successfully' })
  @ApiResponse({ status: 400, description: 'Email already registered or invalid inputs' })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    return this.authService.register(dto, req);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login', description: 'Authenticate user credentials and issue JWT bearer token' })
  @ApiResponse({ status: 200, description: 'Authentication successful, token issued' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, req);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role for role-based evaluation' })
  @ApiOperation({ summary: 'Verify Email', description: 'Submit verification code to confirm user email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: any) {
    return this.authService.verifyEmail({
      userId: req.user.id,
      code: dto.code,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role for role-based evaluation' })
  @ApiOperation({ summary: 'Get Current Profile', description: 'Retrieve profile details of currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current profile retrieved' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getMe(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role for role-based evaluation' })
  @ApiOperation({ summary: 'User Logout', description: 'Invalidate current session and record access logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user, req);
  }

  @Get('access-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires SUPER_ADMIN)' })
  @ApiOperation({ summary: 'Get Access Logs', description: 'Retrieve system sign-in and access audit logs (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Access logs list returned' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires SUPER_ADMIN role' })
  async getAccessLogs(@Req() req: any) {
    return this.authService.getAccessLogs(req.user);
  }
}
