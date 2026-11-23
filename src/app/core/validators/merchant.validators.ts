import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class MerchantValidators {
  static taxId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valid = /^\d{2}-\d{7}$/.test(control.value);
      return valid ? null : { invalidTaxId: true };
    };
  }

  static routingNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = String(control.value).trim();
      const valid = /^\d{9}$/.test(value);
      return valid ? null : { invalidRoutingNumber: true };
    };
  }

  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valid = /^\d{3}-\d{3}-\d{4}$/.test(control.value);
      return valid ? null : { invalidPhone: true };
    };
  }

  static zipCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const valid = /^\d{5}(-\d{4})?$/.test(control.value);
      return valid ? null : { invalidZipCode: true };
    };
  }

  static minPositive(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') return null;
      const num = Number(control.value);
      return num > 0 ? null : { minPositive: true };
    };
  }
}
