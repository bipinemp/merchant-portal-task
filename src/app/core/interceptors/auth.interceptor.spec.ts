import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, throwError } from 'rxjs';
import { authInterceptor, resetInterceptorStateForTesting } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: {
    getAccessToken: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    resetInterceptorStateForTesting();

    authServiceSpy = {
      getAccessToken: vi.fn(),
      refreshToken: vi.fn(),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    resetInterceptorStateForTesting();
  });

  it('should attach Bearer token to outgoing requests', () => {
    authServiceSpy.getAccessToken.mockReturnValue('valid-token-123');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token-123');
    req.flush({ ok: true });
  });

  it('should not attach token to auth endpoints', () => {
    authServiceSpy.getAccessToken.mockReturnValue('valid-token-123');

    http.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
  });

  it('should refresh token only once when multiple concurrent requests receive 401', () => {
    authServiceSpy.getAccessToken.mockReturnValue('expired-token');

    const refreshSubject = new Subject<{ accessToken: string; refreshToken: string }>();
    authServiceSpy.refreshToken.mockReturnValue(refreshSubject.asObservable());

    let res1: unknown = null;
    let res2: unknown = null;

    http.get('/api/resource1').subscribe(r => (res1 = r));
    http.get('/api/resource2').subscribe(r => (res2 = r));

    const req1 = httpMock.expectOne('/api/resource1');
    const req2 = httpMock.expectOne('/api/resource2');

    expect(req1.request.headers.get('Authorization')).toBe('Bearer expired-token');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer expired-token');

    req1.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });
    req2.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);

    refreshSubject.next({ accessToken: 'refreshed-token', refreshToken: 'new-refresh' });
    refreshSubject.complete();

    const retry1 = httpMock.expectOne('/api/resource1');
    const retry2 = httpMock.expectOne('/api/resource2');

    expect(retry1.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    expect(retry2.request.headers.get('Authorization')).toBe('Bearer refreshed-token');

    retry1.flush({ data: 'resource-1-data' });
    retry2.flush({ data: 'resource-2-data' });

    expect(res1).toEqual({ data: 'resource-1-data' });
    expect(res2).toEqual({ data: 'resource-2-data' });
  });

  it('should logout user when refresh token request fails', () => {
    authServiceSpy.getAccessToken.mockReturnValue('expired-token');
    authServiceSpy.refreshToken.mockReturnValue(
      throwError(() => new Error('Refresh failed'))
    );

    let errorThrown = false;
    http.get('/api/resource').subscribe({
      error: () => {
        errorThrown = true;
      }
    });

    const req = httpMock.expectOne('/api/resource');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(errorThrown).toBe(true);
  });
});
