import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { User, LoginResponse, AuthTokens } from '../models/user.model';

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'u1',
    email: 'sales@merchant.com',
    name: 'Sarah Sales',
    role: 'SALES'
  };

  const mockTokens: AuthTokens = {
    accessToken: 'access-123',
    refreshToken: 'refresh-123'
  };

  const mockLoginResponse: LoginResponse = {
    user: mockUser,
    tokens: mockTokens
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyLoginComponent }])
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('should authenticate user and store tokens on login', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.login({ email: 'sales@merchant.com', password: 'password' }).subscribe(res => {
      expect(res.user.email).toBe('sales@merchant.com');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.userRole()).toBe('SALES');
      expect(service.getAccessToken()).toBe('access-123');
      expect(service.getRefreshToken()).toBe('refresh-123');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockLoginResponse);
  });

  it('should clear tokens on logout', () => {
    service.login({ email: 'sales@merchant.com', password: 'password' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush(mockLoginResponse);

    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
  });

  it('should verify roles correctly', () => {
    service.login({ email: 'sales@merchant.com', password: 'password' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush(mockLoginResponse);

    expect(service.hasRole('SALES')).toBe(true);
    expect(service.hasRole('ADMIN')).toBe(false);
    expect(service.hasAnyRole('SALES', 'ADMIN')).toBe(true);
    expect(service.hasAnyRole('REVIEWER')).toBe(false);
  });

  it('should refresh token successfully', () => {
    localStorage.setItem('mp_refresh_token', 'refresh-123');

    service.refreshToken().subscribe(tokens => {
      expect(tokens.accessToken).toBe('new-access');
      expect(service.getAccessToken()).toBe('new-access');
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  });
});
