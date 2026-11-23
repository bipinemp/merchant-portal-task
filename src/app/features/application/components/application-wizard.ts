import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, switchMap, catchError, of, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ApplicationService } from '../../../core/services/application.service';
import { ApplicationDraft, MerchantApplication } from '../../../core/models/application.model';
import { MerchantValidators } from '../../../core/validators/merchant.validators';

@Component({
  selector: 'app-application-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './application-wizard.html',
  styleUrl: './application-wizard.scss'
})
export class ApplicationWizardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appService = inject(ApplicationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentStep = signal(0);
  readonly saving = signal(false);
  readonly savingDraft = signal(false);
  readonly submitting = signal(false);
  readonly lastSaved = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly steps = ['Business Info', 'Contact', 'Banking', 'Processing', 'Review'];

  private readonly draftSubject = new Subject<void>();
  draftId = `draft-${Date.now()}`;
  applicationId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.minLength(2)]],
    businessType: ['', Validators.required],
    taxId: ['', [Validators.required, MerchantValidators.taxId()]],
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    zipCode: ['', [Validators.required, MerchantValidators.zipCode()]],
    country: ['US', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, MerchantValidators.phone()]],
    bankName: ['', Validators.required],
    routingNumber: ['', [Validators.required, MerchantValidators.routingNumber()]],
    accountNumber: ['', [Validators.required, Validators.minLength(4)]],
    accountType: ['checking' as 'checking' | 'savings', Validators.required],
    monthlyVolume: [0, [Validators.required, MerchantValidators.minPositive()]],
    averageTicket: [0, [Validators.required, MerchantValidators.minPositive()]],
    maxTicket: [0, [Validators.required, MerchantValidators.minPositive()]],
    businessDescription: ['', [Validators.required, Validators.minLength(10)]]
  });

  readonly businessTypes = ['Restaurant', 'Retail', 'E-Commerce', 'Professional Services', 'Healthcare', 'Food Service', 'Other'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.applicationId = id;
      this.draftId = `draft-${id}`;
      this.loadExisting(id);
    } else {
      this.loadDraft();
    }

    this.draftSubject.pipe(
      debounceTime(1500),
      switchMap(() => {
        this.saving.set(true);
        this.saveError.set(null);
        const draft: ApplicationDraft = {
          id: this.draftId,
          data: this.buildApplicationData(),
          currentStep: this.currentStep(),
          savedAt: new Date().toISOString()
        };
        return this.appService.saveDraft(draft).pipe(
          catchError(() => {
            this.saveError.set('Auto-save failed');
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.saving.set(false);
      if (result) {
        this.lastSaved.set(new Date().toLocaleTimeString());
        this.saveError.set(null);
      }
    });

    this.form.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.draftSubject.next());
  }

  private loadExisting(id: string): void {
    this.appService.getApplication(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(app => {
      this.form.patchValue({
        businessName: app.businessName,
        businessType: app.businessType,
        taxId: app.taxId,
        street: app.businessAddress?.street ?? '',
        city: app.businessAddress?.city ?? '',
        state: app.businessAddress?.state ?? '',
        zipCode: app.businessAddress?.zipCode ?? '',
        country: app.businessAddress?.country ?? 'US',
        firstName: app.contactInfo?.firstName ?? '',
        lastName: app.contactInfo?.lastName ?? '',
        email: app.contactInfo?.email ?? '',
        phone: app.contactInfo?.phone ?? '',
        bankName: app.bankingInfo?.bankName ?? '',
        routingNumber: app.bankingInfo?.routingNumber ?? '',
        accountNumber: app.bankingInfo?.accountNumber ?? '',
        accountType: app.bankingInfo?.accountType ?? 'checking',
        monthlyVolume: app.processingInfo?.monthlyVolume ?? 0,
        averageTicket: app.processingInfo?.averageTicket ?? 0,
        maxTicket: app.processingInfo?.maxTicket ?? 0,
        businessDescription: app.processingInfo?.businessDescription ?? ''
      });
    });
  }

  private loadDraft(): void {
    this.appService.getDraft(this.draftId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(draft => {
      if (draft?.data) {
        const d = draft.data;
        this.form.patchValue({
          businessName: d.businessName ?? '',
          businessType: d.businessType ?? '',
          taxId: d.taxId ?? '',
          street: d.businessAddress?.street ?? '',
          city: d.businessAddress?.city ?? '',
          state: d.businessAddress?.state ?? '',
          zipCode: d.businessAddress?.zipCode ?? '',
          country: d.businessAddress?.country ?? 'US',
          firstName: d.contactInfo?.firstName ?? '',
          lastName: d.contactInfo?.lastName ?? '',
          email: d.contactInfo?.email ?? '',
          phone: d.contactInfo?.phone ?? '',
          bankName: d.bankingInfo?.bankName ?? '',
          routingNumber: d.bankingInfo?.routingNumber ?? '',
          accountNumber: d.bankingInfo?.accountNumber ?? '',
          accountType: d.bankingInfo?.accountType ?? 'checking',
          monthlyVolume: d.processingInfo?.monthlyVolume ?? 0,
          averageTicket: d.processingInfo?.averageTicket ?? 0,
          maxTicket: d.processingInfo?.maxTicket ?? 0,
          businessDescription: d.processingInfo?.businessDescription ?? ''
        });
        if (typeof draft.currentStep === 'number') {
          this.currentStep.set(draft.currentStep);
        }
      }
    });
  }

  buildApplicationData(): Partial<MerchantApplication> {
    const v = this.form.getRawValue();
    return {
      businessName: v.businessName || 'Draft Application',
      businessType: v.businessType,
      taxId: v.taxId,
      businessAddress: { street: v.street, city: v.city, state: v.state, zipCode: v.zipCode, country: v.country },
      contactInfo: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone },
      bankingInfo: { bankName: v.bankName, routingNumber: v.routingNumber, accountNumber: v.accountNumber, accountType: v.accountType },
      processingInfo: { monthlyVolume: v.monthlyVolume, averageTicket: v.averageTicket, maxTicket: v.maxTicket, businessDescription: v.businessDescription }
    };
  }

  getStepFields(step: number): string[] {
    const fieldMap: Record<number, string[]> = {
      0: ['businessName', 'businessType', 'taxId', 'street', 'city', 'state', 'zipCode', 'country'],
      1: ['firstName', 'lastName', 'email', 'phone'],
      2: ['bankName', 'routingNumber', 'accountNumber', 'accountType'],
      3: ['monthlyVolume', 'averageTicket', 'maxTicket', 'businessDescription']
    };
    return fieldMap[step] ?? [];
  }

  isStepValid(step: number): boolean {
    if (step === 4) return this.form.valid;
    return this.getStepFields(step).every(f => this.form.get(f)?.valid ?? true);
  }

  nextStep(): void {
    const fields = this.getStepFields(this.currentStep());
    fields.forEach(f => this.form.get(f)?.markAsTouched());

    if (this.isStepValid(this.currentStep())) {
      this.currentStep.update(s => Math.min(s + 1, this.steps.length - 1));
    }
  }

  prevStep(): void {
    this.currentStep.update(s => Math.max(s - 1, 0));
  }

  goToStep(step: number): void {
    if (step < this.currentStep() || this.isStepValid(this.currentStep())) {
      this.currentStep.set(step);
    }
  }

  saveAsDraft(): void {
    this.savingDraft.set(true);
    const data = this.buildApplicationData();

    const save$ = this.applicationId
      ? this.appService.updateApplication(this.applicationId, data)
      : this.appService.createApplication(data);

    save$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: app => {
        this.savingDraft.set(false);
        this.applicationId = app.id;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.savingDraft.set(false);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const data = this.buildApplicationData();

    const save$ = this.applicationId
      ? this.appService.updateApplication(this.applicationId, data)
      : this.appService.createApplication(data);

    save$.pipe(
      switchMap(app => this.appService.submitApplication(app.id)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  getControl(name: string) {
    return this.form.get(name);
  }

  isInvalid(name: string): boolean {
    const ctrl = this.getControl(name);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
