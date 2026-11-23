import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationService } from './application.service';
import { MerchantApplication, ApplicationDraft } from '../models/application.model';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let httpMock: HttpTestingController;

  const mockApp: MerchantApplication = {
    id: 'app-001',
    businessName: 'Acme Coffee Shop',
    businessType: 'Restaurant',
    taxId: '12-3456789',
    businessAddress: { street: '123 Main St', city: 'Portland', state: 'OR', zipCode: '97201', country: 'US' },
    contactInfo: { firstName: 'John', lastName: 'Doe', email: 'john@acme.com', phone: '503-555-0101' },
    bankingInfo: { bankName: 'First National', routingNumber: '021000021', accountNumber: '****4567', accountType: 'checking' },
    processingInfo: { monthlyVolume: 50000, averageTicket: 25, maxTicket: 200, businessDescription: 'Coffee shop' },
    status: 'SUBMITTED',
    assignedReviewerId: 'u2',
    createdBy: 'u1',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-16T14:30:00Z',
    riskHistory: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ApplicationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch paginated applications with query params', () => {
    service.getApplications({ page: 2, pageSize: 5, status: 'SUBMITTED', search: 'Acme' }).subscribe(res => {
      expect(res.data.length).toBe(1);
      expect(res.total).toBe(1);
    });

    const req = httpMock.expectOne(r => r.url === '/api/applications');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('5');
    expect(req.request.params.get('status')).toBe('SUBMITTED');
    expect(req.request.params.get('search')).toBe('Acme');
    req.flush({ data: [mockApp], total: 1, page: 2, pageSize: 5 });
  });

  it('should fetch single application by id', () => {
    service.getApplication('app-001').subscribe(app => {
      expect(app.id).toBe('app-001');
      expect(app.businessName).toBe('Acme Coffee Shop');
    });

    const req = httpMock.expectOne('/api/applications/app-001');
    expect(req.request.method).toBe('GET');
    req.flush(mockApp);
  });

  it('should save draft application', () => {
    const draft: ApplicationDraft = {
      id: 'draft-123',
      data: { businessName: 'Draft Co' },
      currentStep: 1,
      savedAt: '2026-11-21T00:00:00Z'
    };

    service.saveDraft(draft).subscribe(saved => {
      expect(saved.id).toBe('draft-123');
    });

    const req = httpMock.expectOne('/api/applications/drafts/draft-123');
    expect(req.request.method).toBe('PUT');
    req.flush(draft);
  });

  it('should submit review decision', () => {
    service.submitReview('app-001', {
      reviewerId: 'u2',
      reviewerName: 'Ryan Reviewer',
      decision: 'APPROVED',
      notes: 'Risk verified'
    }).subscribe(app => {
      expect(app.status).toBe('APPROVED');
    });

    const req = httpMock.expectOne('/api/applications/app-001/review');
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockApp, status: 'APPROVED' });
  });

  it('should assign reviewer to application', () => {
    service.assignReviewer('app-001', 'u2').subscribe(app => {
      expect(app.assignedReviewerId).toBe('u2');
    });

    const req = httpMock.expectOne('/api/applications/app-001/assign');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reviewerId: 'u2' });
    req.flush({ ...mockApp, assignedReviewerId: 'u2' });
  });
});
