import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import {
  MerchantApplication,
  ApplicationStatus,
  PaginatedResponse,
  ApplicationFilter,
} from '../../core/models/application.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly appService = inject(ApplicationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly applications = signal<MerchantApplication[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<ApplicationStatus | ''>('');

  readonly statuses: ApplicationStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
  ];

  private readonly searchSubject = new Subject<string>();

  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize());
  }

  get canCreateApplication(): boolean {
    return this.auth.hasAnyRole('SALES', 'ADMIN');
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.loadApplications();
      });

    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter: ApplicationFilter = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      status: this.statusFilter() || undefined,
      search: this.searchTerm() || undefined,
    };

    this.appService
      .getApplications(filter)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((_) => {
          this.error.set('Failed to load applications. Please try again.');
          return of({
            data: [],
            total: 0,
            page: 1,
            pageSize: 10,
          } as PaginatedResponse<MerchantApplication>);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.applications.set(result.data);
        this.totalItems.set(result.total);
      });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status as ApplicationStatus | '');
    this.currentPage.set(1);
    this.loadApplications();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage.set(page);
    this.loadApplications();
  }

  viewApplication(app: MerchantApplication): void {
    this.router.navigate(['/applications', app.id]);
  }

  editApplication(app: MerchantApplication): void {
    this.router.navigate(['/applications', app.id, 'edit']);
  }

  newApplication(): void {
    this.router.navigate(['/applications/new']);
  }

  getStatusClass(status: ApplicationStatus): string {
    const map: Record<ApplicationStatus, string> = {
      DRAFT: 'bg-secondary',
      SUBMITTED: 'bg-info',
      UNDER_REVIEW: 'bg-warning text-dark',
      APPROVED: 'bg-success',
      REJECTED: 'bg-danger',
    };
    return map[status];
  }

  retry(): void {
    this.loadApplications();
  }
}
