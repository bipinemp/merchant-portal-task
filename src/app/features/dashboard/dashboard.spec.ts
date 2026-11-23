import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { MerchantApplication } from '../../core/models/application.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let appServiceSpy: { getApplications: ReturnType<typeof vi.fn> };
  let authServiceSpy: { hasAnyRole: ReturnType<typeof vi.fn>; user: ReturnType<typeof vi.fn> };

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
      getApplications: vi.fn().mockReturnValue(of({ data: [mockApp], total: 1, page: 1, pageSize: 10 }))
    };
    authServiceSpy = {
      hasAnyRole: vi.fn().mockReturnValue(true),
      user: vi.fn().mockReturnValue({ id: 'u1', role: 'SALES', name: 'Sarah' })
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: ApplicationService, useValue: appServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load applications', () => {
    expect(component.applications().length).toBe(1);
    expect(component.totalItems()).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should filter applications by status', () => {
    component.onStatusChange('APPROVED');
    expect(component.statusFilter()).toBe('APPROVED');
    expect(component.currentPage()).toBe(1);
    expect(appServiceSpy.getApplications).toHaveBeenCalledWith(expect.objectContaining({ status: 'APPROVED' }));
  });

  it('should change page when goToPage is called', () => {
    component.totalItems.set(25);
    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
  });
});
