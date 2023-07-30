import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async login(dto: AuthDto) {
    // find the user by email
    // check exists
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toString(),
      },
    });

    if (!user) {
      throw new ForbiddenException('Credential incorrect!');
    }

    //compare password
    const passwordChecker = await argon.verify(
      user.hash,
      dto.password.toString(),
    );
    //check password
    if (!passwordChecker) {
      throw new ForbiddenException('Credential incorrect!');
    }

    return this.signToken(user.id, user.email);
  }

  async signup(dto: AuthDto) {
    // generate hash password
    const hash = await argon.hash(dto.password.toString());

    // save to database
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toString(),
          hash,
        },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken...');
        }
      }
      throw error;
    }
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: String }> {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
