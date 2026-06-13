import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Response, Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { TokenPayload } from '../../common/interfaces/active-user-data.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(data: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as any,
    });

    // Gắn refresh_token vào HttpOnly cookie — JS không đọc được
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only ở production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
      path: '/api/auth', // chỉ gửi cookie khi gọi /api/auth/*
    });

    return {
      success: true,
      access_token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(req: Request) {
    const token = req.cookies?.refresh_token;
    if (!token) {
      throw new UnauthorizedException('Không có refresh token');
    }

    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Kiểm tra user vẫn còn tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const access_token = this.jwtService.sign(
      { sub: user.id, username: user.username, role: user.role },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      },
    );

    return { access_token };
  }

  logout(res: Response) {
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { success: true, message: 'Đăng xuất thành công' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    return user;
  }
}
