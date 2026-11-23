import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ApplicationDetailComponent } from './application-detail';
import { ApplicationService } from '../../../../core/services/application.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MerchantApplication } from '../../../../core/models/application.model';

describe('ApplicationDetailComponent', () => {
  let component: ApplicationDetailComponent;
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let appServiceSpy: {
    getApplication: ReturnType<typeof vi.fn>;
    submitReview: ReturnType<typeof vi.fn>;
    assignReviewer: ReturnType<typeof vi.fn>;
  };
  let authServiceSpy: {
    hasAnyRole: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
    user: ReturnType<typeof vi.fn>;
  };

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

  beforeEach(async () => {
    appServiceSpy = {
      getApplication: vi.fn().mockReturnValue(of(mockApp)),
      submitReview: vi.fn().mockReturnValue(of({ ...mockApp, status: 'APPROVED' })),
      assignReviewer: vi.fn().mockReturnValue(of({ ...mockApp, assignedReviewerId: 'u2' }))
    };
    authServiceSpy = {
      hasAnyRole: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockReturnValue(true),
      user: vi.fn().mockReturnValue({ id: 'u2', name: 'Ryan Reviewer', role: 'REVIEWER' })
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        { provide: ApplicationService, useValue: appServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'app-001' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load application details on init', () => {
    expect(component.application()?.id).toBe('app-001');
    expect(component.loading()).toBe(false);
  });

  it('should toggle sensitive info when role allows', () => {
    expect(component.showSensitive()).toBe(false);
    component.toggleSensitive();
    expect(component.showSensitive()).toBe(true);
    component.toggleSensitive();
    expect(component.showSensitive()).toBe(false);
  });

  it('should submit review decision', () => {
    component.reviewForm.patchValue({
      decision: 'APPROVED',
      notes: 'Approved following document verification.'
    });

    component.submitReview();
    expect(appServiceSpy.submitReview).toHaveBeenCalled();
  });

  it('should assign reviewer when admin', () => {
    component.assignForm.patchValue({ reviewerId: 'u2' });
    component.assignReviewer();
    expect(appServiceSpy.assignReviewer).toHaveBeenCalledWith('app-001', 'u2');
  });
});
