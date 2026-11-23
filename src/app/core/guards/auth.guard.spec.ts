import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Guards', () => {
  let authServiceSpy: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasAnyRole: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: vi.fn(),
      hasAnyRole: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow access if authenticated', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /login if unauthenticated', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(false);
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)) as UrlTree;
      expect(result.toString()).toBe('/login');
    });
  });

  describe('roleGuard', () => {
    it('should allow access if user has one of required roles', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(true);

      const guard = roleGuard('SALES', 'ADMIN');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /dashboard if user lacks role', () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);
      authServiceSpy.hasAnyRole.mockReturnValue(false);

      const guard = roleGuard('ADMIN');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any)) as UrlTree;
      expect(result.toString()).toBe('/dashboard');
    });
  });
});
