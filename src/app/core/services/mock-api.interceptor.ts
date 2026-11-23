import { HttpInterceptorFn, HttpResponse, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { MerchantApplication, PaginatedResponse, ApplicationDraft, RiskDecision } from '../models/application.model';
import { LoginResponse, AuthTokens, User } from '../models/user.model';

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'sales@merchant.com': {
    password: 'password',
    user: { id: 'u1', email: 'sales@merchant.com', name: 'Sarah Sales', role: 'SALES' }
  },
  'reviewer@merchant.com': {
    password: 'password',
    user: { id: 'u2', email: 'reviewer@merchant.com', name: 'Ryan Reviewer', role: 'REVIEWER' }
  },
  'admin@merchant.com': {
    password: 'password',
    user: { id: 'u3', email: 'admin@merchant.com', name: 'Amy Admin', role: 'ADMIN' }
  }
};

let mockApplications: MerchantApplication[] = [
  {
    id: 'app-001',
    businessName: 'Acme Coffee Shop',
    businessType: 'Restaurant',
    taxId: '12-3456789',
    businessAddress: { street: '123 Main St', city: 'Portland', state: 'OR', zipCode: '97201', country: 'US' },
    contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@acme.com', phone: '503-555-0101' },
    bankingInfo: { bankName: 'First National', routingNumber: '021000021', accountNumber: '****4567', accountType: 'checking' },
    processingInfo: { monthlyVolume: 50000, averageTicket: 25, maxTicket: 200, businessDescription: 'Local specialty coffee and pastries shop' },
    status: 'SUBMITTED',
    assignedReviewerId: 'u2',
    createdBy: 'u1',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-16T14:30:00Z',
    riskHistory: []
  },
  {
    id: 'app-002',
    businessName: 'TechGear Online',
    businessType: 'E-Commerce',
    taxId: '98-7654321',
    businessAddress: { street: '456 Oak Ave', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'US' },
    contactInfo: { firstName: 'Jane', lastName: 'Smith', email: 'jane@techgear.com', phone: '206-555-0202' },
    bankingInfo: { bankName: 'Chase Bank', routingNumber: '021000021', accountNumber: '****8901', accountType: 'checking' },
    processingInfo: { monthlyVolume: 150000, averageTicket: 85, maxTicket: 2000, businessDescription: 'Consumer electronics and accessories store' },
    status: 'UNDER_REVIEW',
    assignedReviewerId: 'u2',
    createdBy: 'u1',
    createdAt: '2026-10-10T08:00:00Z',
    updatedAt: '2026-10-18T09:15:00Z',
    riskHistory: [
      { id: 'rd-001', reviewerId: 'u2', reviewerName: 'Ryan Reviewer', decision: 'REJECTED', notes: 'Missing secondary business documentation.', createdAt: '2026-10-17T11:00:00Z' }
    ]
  },
  {
    id: 'app-003',
    businessName: 'Green Garden Supplies',
    businessType: 'Retail',
    taxId: '55-1234567',
    businessAddress: { street: '789 Elm Blvd', city: 'Denver', state: 'CO', zipCode: '80201', country: 'US' },
    contactInfo: { firstName: 'Mike', lastName: 'Green', email: 'mike@greengarden.com', phone: '303-555-0303' },
    bankingInfo: { bankName: 'Wells Fargo', routingNumber: '021000021', accountNumber: '****2345', accountType: 'savings' },
    processingInfo: { monthlyVolume: 30000, averageTicket: 45, maxTicket: 500, businessDescription: 'Garden and organic nursery supplies' },
    status: 'APPROVED',
    assignedReviewerId: 'u2',
    createdBy: 'u1',
    createdAt: '2026-09-20T12:00:00Z',
    updatedAt: '2026-10-01T16:00:00Z',
    riskHistory: [
      { id: 'rd-002', reviewerId: 'u2', reviewerName: 'Ryan Reviewer', decision: 'APPROVED', notes: 'All documentation verified. Low risk profile.', createdAt: '2026-09-30T14:00:00Z' }
    ]
  },
  {
    id: 'app-004',
    businessName: 'QuickBite Delivery',
    businessType: 'Food Service',
    taxId: '33-9876543',
    businessAddress: { street: '321 Pine Rd', city: 'Austin', state: 'TX', zipCode: '73301', country: 'US' },
    contactInfo: { firstName: 'Lisa', lastName: 'Chen', email: 'lisa@quickbite.com', phone: '512-555-0404' },
    bankingInfo: { bankName: 'Bank of America', routingNumber: '021000021', accountNumber: '****6789', accountType: 'checking' },
    processingInfo: { monthlyVolume: 75000, averageTicket: 30, maxTicket: 150, businessDescription: 'Food delivery operations and courier service' },
    status: 'DRAFT',
    assignedReviewerId: null,
    createdBy: 'u1',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-05T11:00:00Z',
    riskHistory: []
  },
  {
    id: 'app-005',
    businessName: 'Luxe Boutique',
    businessType: 'Retail',
    taxId: '77-1112233',
    businessAddress: { street: '555 Fashion Dr', city: 'Miami', state: 'FL', zipCode: '33101', country: 'US' },
    contactInfo: { firstName: 'Eva', lastName: 'Martinez', email: 'eva@luxe.com', phone: '305-555-0505' },
    bankingInfo: { bankName: 'Citibank', routingNumber: '021000021', accountNumber: '****0123', accountType: 'checking' },
    processingInfo: { monthlyVolume: 200000, averageTicket: 250, maxTicket: 5000, businessDescription: 'High-end apparel and luxury accessories' },
    status: 'REJECTED',
    assignedReviewerId: 'u2',
    createdBy: 'u1',
    createdAt: '2026-08-15T07:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    riskHistory: [
      { id: 'rd-003', reviewerId: 'u2', reviewerName: 'Ryan Reviewer', decision: 'REJECTED', notes: 'Excessive refund rate in previous processor history.', createdAt: '2026-08-28T13:00:00Z' }
    ]
  }
];

const mockDrafts: Record<string, ApplicationDraft> = {};
let tokenCounter = 0;

function generateToken(): string {
  tokenCounter++;
  return `mock-token-${tokenCounter}-${Date.now()}`;
}

export const mockApiInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const url = req.url;

  if (req.headers.get('Authorization') === 'Bearer expired-token') {
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: req.url }));
  }

  if ((url.endsWith('/auth/login') || url === '/api/auth/login') && req.method === 'POST') {
    const body = req.body as { email: string; password: string };
    const entry = MOCK_USERS[body?.email];
    if (entry && entry.password === body?.password) {
      const response: LoginResponse = {
        user: entry.user,
        tokens: { accessToken: generateToken(), refreshToken: `refresh-${Date.now()}` }
      };
      return of(new HttpResponse({ status: 200, body: response })).pipe(delay(50));
    }
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', error: { message: 'Invalid credentials' } }));
  }

  if ((url.endsWith('/auth/refresh') || url === '/api/auth/refresh') && req.method === 'POST') {
    const tokens: AuthTokens = {
      accessToken: generateToken(),
      refreshToken: `refresh-${Date.now()}`
    };
    return of(new HttpResponse({ status: 200, body: tokens })).pipe(delay(50));
  }

  if (url.includes('/api/applications') && req.method === 'GET') {
    const matchId = url.match(/\/api\/applications\/(app-\d+)$/);
    if (matchId) {
      const id = matchId[1];
      const found = mockApplications.find(a => a.id === id);
      if (found) {
        return of(new HttpResponse({ status: 200, body: { ...found } })).pipe(delay(50));
      }
      return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
    }

    const draftMatch = url.match(/\/api\/applications\/drafts\/(.+)$/);
    if (draftMatch) {
      const id = draftMatch[1];
      const draft = mockDrafts[id] ?? null;
      return of(new HttpResponse({ status: 200, body: draft })).pipe(delay(50));
    }

    const page = Number(req.params.get('page')) || 1;
    const pageSize = Number(req.params.get('pageSize')) || 10;
    const status = req.params.get('status');
    const search = req.params.get('search');

    let filtered = [...mockApplications];
    if (status) filtered = filtered.filter(a => a.status === status);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.businessName.toLowerCase().includes(s) ||
        a.id.toLowerCase().includes(s)
      );
    }

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    const response: PaginatedResponse<MerchantApplication> = {
      data: paged,
      total: filtered.length,
      page,
      pageSize
    };
    return of(new HttpResponse({ status: 200, body: response })).pipe(delay(50));
  }

  if (url === '/api/applications' && req.method === 'POST') {
    const body = req.body as Partial<MerchantApplication>;
    const newApp: MerchantApplication = {
      id: `app-${String(mockApplications.length + 1).padStart(3, '0')}`,
      businessName: body.businessName ?? '',
      businessType: body.businessType ?? '',
      taxId: body.taxId ?? '',
      businessAddress: body.businessAddress ?? { street: '', city: '', state: '', zipCode: '', country: 'US' },
      contactInfo: body.contactInfo ?? { firstName: '', lastName: '', email: '', phone: '' },
      bankingInfo: body.bankingInfo ?? { bankName: '', routingNumber: '', accountNumber: '', accountType: 'checking' },
      processingInfo: body.processingInfo ?? { monthlyVolume: 0, averageTicket: 0, maxTicket: 0, businessDescription: '' },
      status: 'DRAFT',
      assignedReviewerId: null,
      createdBy: 'u1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskHistory: []
    };
    mockApplications.push(newApp);
    return of(new HttpResponse({ status: 201, body: newApp })).pipe(delay(50));
  }

  if (url.match(/\/api\/applications\/(app-\d+)$/) && req.method === 'PUT') {
    const id = url.split('/').pop()!;
    const idx = mockApplications.findIndex(a => a.id === id);
    if (idx >= 0) {
      mockApplications[idx] = { ...mockApplications[idx], ...(req.body as Partial<MerchantApplication>), updatedAt: new Date().toISOString() };
      return of(new HttpResponse({ status: 200, body: mockApplications[idx] })).pipe(delay(50));
    }
    return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }

  if (url.match(/\/api\/applications\/(app-\d+)\/submit$/) && req.method === 'POST') {
    const parts = url.split('/');
    const id = parts[parts.length - 2];
    const idx = mockApplications.findIndex(a => a.id === id);
    if (idx >= 0) {
      mockApplications[idx] = { ...mockApplications[idx], status: 'SUBMITTED', updatedAt: new Date().toISOString() };
      return of(new HttpResponse({ status: 200, body: mockApplications[idx] })).pipe(delay(50));
    }
    return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }

  if (url.includes('/api/applications/drafts/') && req.method === 'PUT') {
    const id = url.split('/').pop()!;
    const draft = req.body as ApplicationDraft;
    mockDrafts[id] = { ...draft, savedAt: new Date().toISOString() };
    return of(new HttpResponse({ status: 200, body: mockDrafts[id] })).pipe(delay(50));
  }

  if (url.match(/\/api\/applications\/(app-\d+)\/review$/) && req.method === 'POST') {
    const parts = url.split('/');
    const id = parts[parts.length - 2];
    const idx = mockApplications.findIndex(a => a.id === id);
    if (idx >= 0) {
      const body = req.body as Omit<RiskDecision, 'id' | 'createdAt'>;
      const decision: RiskDecision = {
        id: `rd-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString()
      };
      mockApplications[idx].riskHistory.unshift(decision);
      mockApplications[idx].status = body.decision;
      mockApplications[idx].updatedAt = new Date().toISOString();
      return of(new HttpResponse({ status: 200, body: mockApplications[idx] })).pipe(delay(50));
    }
    return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }

  if (url.match(/\/api\/applications\/(app-\d+)\/assign$/) && req.method === 'POST') {
    const parts = url.split('/');
    const id = parts[parts.length - 2];
    const idx = mockApplications.findIndex(a => a.id === id);
    if (idx >= 0) {
      const body = req.body as { reviewerId: string };
      mockApplications[idx].assignedReviewerId = body.reviewerId;
      mockApplications[idx].status = 'UNDER_REVIEW';
      mockApplications[idx].updatedAt = new Date().toISOString();
      return of(new HttpResponse({ status: 200, body: mockApplications[idx] })).pipe(delay(50));
    }
    return throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }

  return next(req);
};
