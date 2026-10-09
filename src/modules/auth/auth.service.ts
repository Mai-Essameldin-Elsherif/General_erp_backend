import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  import { User } from './entities/user.entity.js';
  import { RegisterDto } from './dto/register.dto.js';
  import { LoginDto } from './dto/login.dto.js';
  
  @Injectable()
  export class AuthService {
    constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      private readonly jwtService: JwtService,
    ) {}
  
    async register(registerDto: RegisterDto) {
      const { email, password, firstName, lastName, role } = registerDto;
  
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
  
      const user = this.userRepository.create({
        email,
        passwordHash,
        firstName,
        lastName,
        role,
      });
  
      await this.userRepository.save(user);
  
      const { passwordHash: _, ...result } = user;
      return {
        message: 'User registered successfully',
        user: result,
      };
    }
  
    async login(loginDto: LoginDto) {
      const { email, password } = loginDto;
  
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      
  
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);
  
      const { passwordHash: _, ...userData } = user;
  
      return {
        message: 'Login successful',
        accessToken,
        user: userData,
      };
    }

    async getProfile(userId: string) {
        const user = await this.userRepository.findOne({ 
          where: { id: userId }
        });
        
        if (!user) {
          throw new NotFoundException('User not found');
        }
        
        const { passwordHash, ...result } = user;
        return result;
      }
  }