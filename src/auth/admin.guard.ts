import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminId = request.headers['x-admin-id'];
    const adminPassword = request.headers['x-admin-password'];

    if (adminId === 'admin' && adminPassword === 'admin123') {
      return true;
    }

    throw new UnauthorizedException('Invalid admin credentials');
  }
}
