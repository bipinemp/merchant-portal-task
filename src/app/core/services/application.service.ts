import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MerchantApplication,
  ApplicationDraft,
  PaginatedResponse,
  ApplicationFilter,
  RiskDecision
} from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/applications';

  getApplications(filter: ApplicationFilter): Observable<PaginatedResponse<MerchantApplication>> {
    let params = new HttpParams()
      .set('page', filter.page)
      .set('pageSize', filter.pageSize);

    if (filter.status) params = params.set('status', filter.status);
    if (filter.search) params = params.set('search', filter.search);

    return this.http.get<PaginatedResponse<MerchantApplication>>(this.baseUrl, { params });
  }

  getApplication(id: string): Observable<MerchantApplication> {
    return this.http.get<MerchantApplication>(`${this.baseUrl}/${id}`);
  }

  createApplication(data: Partial<MerchantApplication>): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(this.baseUrl, data);
  }

  updateApplication(id: string, data: Partial<MerchantApplication>): Observable<MerchantApplication> {
    return this.http.put<MerchantApplication>(`${this.baseUrl}/${id}`, data);
  }

  submitApplication(id: string): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(`${this.baseUrl}/${id}/submit`, {});
  }

  saveDraft(draft: ApplicationDraft): Observable<ApplicationDraft> {
    return this.http.put<ApplicationDraft>(`${this.baseUrl}/drafts/${draft.id}`, draft);
  }

  getDraft(id: string): Observable<ApplicationDraft | null> {
    return this.http.get<ApplicationDraft | null>(`${this.baseUrl}/drafts/${id}`);
  }

  submitReview(applicationId: string, decision: Omit<RiskDecision, 'id' | 'createdAt'>): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(`${this.baseUrl}/${applicationId}/review`, decision);
  }

  assignReviewer(applicationId: string, reviewerId: string): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(`${this.baseUrl}/${applicationId}/assign`, { reviewerId });
  }
}
