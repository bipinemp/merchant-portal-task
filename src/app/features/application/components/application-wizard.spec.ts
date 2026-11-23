import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ApplicationWizardComponent } from './application-wizard';
import { ApplicationService } from '../../../core/services/application.service';

describe('ApplicationWizardComponent', () => {
  let component: ApplicationWizardComponent;
  let fixture: ComponentFixture<ApplicationWizardComponent>;
  let router: Router;
  let appServiceSpy: {
    getDraft: ReturnType<typeof vi.fn>;
    saveDraft: ReturnType<typeof vi.fn>;
    getApplication: ReturnType<typeof vi.fn>;
    createApplication: ReturnType<typeof vi.fn>;
    updateApplication: ReturnType<typeof vi.fn>;
    submitApplication: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    appServiceSpy = {
      getDraft: vi.fn().mockReturnValue(of(null)),
      saveDraft: vi.fn().mockReturnValue(of({ id: 'draft-1', currentStep: 0, savedAt: 'now', data: {} })),
      getApplication: vi.fn().mockReturnValue(of(null)),
      createApplication: vi.fn().mockReturnValue(of({ id: 'app-999', status: 'DRAFT' })),
      updateApplication: vi.fn().mockReturnValue(of({ id: 'app-999', status: 'DRAFT' })),
      submitApplication: vi.fn().mockReturnValue(of({ id: 'app-999', status: 'SUBMITTED' }))
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationWizardComponent],
      providers: [
        { provide: ApplicationService, useValue: appServiceSpy },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'new' } }
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(ApplicationWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('should initialize at step 0', () => {
    expect(component.currentStep()).toBe(0);
    expect(component.form.valid).toBe(false);
  });

  it('should prevent moving to step 1 when step 0 is invalid', () => {
    component.nextStep();
    expect(component.currentStep()).toBe(0);
  });

  it('should advance to step 1 when step 0 fields are valid', () => {
    component.form.patchValue({
      businessName: 'Valid Business',
      businessType: 'Retail',
      taxId: '12-3456789',
      street: '123 Main St',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
      country: 'US'
    });

    component.nextStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should auto-save draft after debounced form modification', () => {
    component.form.controls.businessName.setValue('Debounce Test Corp');
    vi.advanceTimersByTime(1600);
    expect(appServiceSpy.saveDraft).toHaveBeenCalled();
  });

  it('should explicitly save as draft when saveAsDraft is called', () => {
    component.form.controls.businessName.setValue('Manual Draft Business');
    component.saveAsDraft();
    expect(appServiceSpy.createApplication).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
