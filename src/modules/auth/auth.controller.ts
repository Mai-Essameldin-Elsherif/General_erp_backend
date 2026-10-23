import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Request } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Req() req: Request & { user?: any }) {
 
  return this.authService.refreshToken(req.user);
}

@Get('me')
async getProfile(@Req() req: Request & { user?: { id: string } }) {
  let userId = req.user?.id as string;
  if (!userId && req.headers?.authorization) {
    try {
      const parts = req.headers.authorization.split(' ');
      const token = parts.length === 2 ? parts[1] : parts[0];
      if (token && token.includes('.')) {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub;
      }
    } catch {}
  }
  return this.authService.getProfile(userId);
}
}