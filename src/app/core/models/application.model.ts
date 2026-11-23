export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface MerchantApplication {
  id: string;
  businessName: string;
  businessType: string;
  taxId: string;
  businessAddress: BusinessAddress;
  contactInfo: ContactInfo;
  bankingInfo: BankingInfo;
  processingInfo: ProcessingInfo;
  status: ApplicationStatus;
  assignedReviewerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  riskHistory: RiskDecision[];
}

export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface BankingInfo {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
}

export interface ProcessingInfo {
  monthlyVolume: number;
  averageTicket: number;
  maxTicket: number;
  businessDescription: string;
}

export interface RiskDecision {
  id: string;
  reviewerId: string;
  reviewerName: string;
  decision: 'APPROVED' | 'REJECTED';
  notes: string;
  createdAt: string;
}

export interface ApplicationDraft {
  id: string;
  data: Partial<MerchantApplication>;
  currentStep: number;
  savedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApplicationFilter {
  status?: ApplicationStatus;
  search?: string;
  page: number;
  pageSize: number;
}
