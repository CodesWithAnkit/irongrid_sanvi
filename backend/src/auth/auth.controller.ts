import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly config: ConfigService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: LoginDto, 
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const { user, tokens } = await this.authService.login(body.email, body.password);

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const configuredDomain = this.config.get<string>('COOKIE_DOMAIN');
    const sameSite: 'lax' | 'strict' | 'none' = isProd ? 'none' : 'lax';
    const baseCookie = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
    } as const;

    const withDomain = (opts: any) =>
      configuredDomain && configuredDomain !== 'localhost' ? { ...opts, domain: configuredDomain } : opts;

    res.cookie('accessToken', tokens.accessToken, withDomain({ ...baseCookie, maxAge: 15 * 60 * 1000 }));
    res.cookie('refreshToken', tokens.refreshToken, withDomain({ ...baseCookie, maxAge: 7 * 24 * 60 * 60 * 1000 }));

    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @UseGuards(AuthGuard('jwt'))
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const payload = (req as any).user as { sub: string };
    await this.authService.logout(payload.sub);

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const configuredDomain = this.config.get<string>('COOKIE_DOMAIN');
    const sameSite: 'lax' | 'strict' | 'none' = isProd ? 'none' : 'lax';
    const baseCookie = { httpOnly: true, sameSite, path: '/' } as const;
    const withDomain = (opts: any) =>
      configuredDomain && configuredDomain !== 'localhost' ? { ...opts, domain: configuredDomain } : opts;

    res.clearCookie('accessToken', withDomain(baseCookie));
    res.clearCookie('refreshToken', withDomain(baseCookie));
    return { ok: true };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const payload = (req as any).user as { sub: string; email: string };
    const tokens = await this.authService.refreshTokens(payload.sub, payload.email);

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const configuredDomain = this.config.get<string>('COOKIE_DOMAIN');
    const sameSite: 'lax' | 'strict' | 'none' = isProd ? 'none' : 'lax';
    const baseCookie = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
    } as const;
    const withDomain = (opts: any) =>
      configuredDomain && configuredDomain !== 'localhost' ? { ...opts, domain: configuredDomain } : opts;

    res.cookie('accessToken', tokens.accessToken, withDomain({ ...baseCookie, maxAge: 15 * 60 * 1000 }));
    res.cookie('refreshToken', tokens.refreshToken, withDomain({ ...baseCookie, maxAge: 7 * 24 * 60 * 60 * 1000 }));

    return { ok: true };
  }

  @Get('me')
  @ApiCookieAuth('accessToken')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@Req() req: Request) {
    const payload = (req as any).user as { sub: string };
    return this.authService.getProfile(payload.sub);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.email);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { message: 'Password reset successful' };
  }
}
