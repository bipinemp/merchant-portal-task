import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ApplicationService } from '../../../../core/services/application.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MerchantApplication } from '../../../../core/models/application.model';
import { MaskSensitivePipe } from '../../../../shared/pipes/mask-sensitive.pipe';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, CurrencyPipe, MaskSensitivePipe],
  templateUrl: './application-detail.html',
  styleUrl: './application-detail.scss'
})
export class ApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appService = inject(ApplicationService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly application = signal<MerchantApplication | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showSensitive = signal(false);
  readonly submittingReview = signal(false);
  readonly assigningReviewer = signal(false);

  readonly reviewForm = this.fb.nonNullable.group({
    decision: ['APPROVED' as 'APPROVED' | 'REJECTED', Validators.required],
    notes: ['', [Validators.required, Validators.minLength(5)]]
  });

  readonly assignForm = this.fb.nonNullable.group({
    reviewerId: ['u2', Validators.required]
  });

  readonly reviewers = [
    { id: 'u2', name: 'Ryan Reviewer (u2)' },
    { id: 'u3', name: 'Amy Admin (u3)' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadApplication(id);
  }

  private loadApplication(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.appService.getApplication(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: app => {
        this.application.set(app);
        if (app.assignedReviewerId) {
          this.assignForm.patchValue({ reviewerId: app.assignedReviewerId });
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load application.');
        this.loading.set(false);
      }
    });
  }

  get canReview(): boolean {
    return this.auth.hasAnyRole('REVIEWER', 'ADMIN');
  }

  get canManageAssignments(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  get isReviewable(): boolean {
    const app = this.application();
    return !!app && (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW');
  }

  toggleSensitive(): void {
    if (this.auth.hasAnyRole('ADMIN', 'REVIEWER')) {
      this.showSensitive.update(v => !v);
    }
  }

  assignReviewer(): void {
    if (this.assignForm.invalid || !this.application()) return;
    this.assigningReviewer.set(true);
    const { reviewerId } = this.assignForm.getRawValue();

    this.appService.assignReviewer(this.application()!.id, reviewerId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: updated => {
        this.application.set(updated);
        this.assigningReviewer.set(false);
      },
      error: () => this.assigningReviewer.set(false)
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid || !this.application()) return;
    this.reviewForm.markAllAsTouched();

    this.submittingReview.set(true);
    const { decision, notes } = this.reviewForm.getRawValue();

    this.appService.submitReview(this.application()!.id, {
      reviewerId: this.auth.user()!.id,
      reviewerName: this.auth.user()!.name,
      decision,
      notes
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: updated => {
        this.application.set(updated);
        this.submittingReview.set(false);
        this.reviewForm.reset({ decision: 'APPROVED', notes: '' });
      },
      error: () => this.submittingReview.set(false)
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'bg-secondary',
      SUBMITTED: 'bg-info',
      UNDER_REVIEW: 'bg-warning text-dark',
      APPROVED: 'bg-success',
      REJECTED: 'bg-danger'
    };
    return map[status] ?? 'bg-secondary';
  }
}
