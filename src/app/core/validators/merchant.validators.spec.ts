import { FormControl } from '@angular/forms';
import { MerchantValidators } from './merchant.validators';

describe('MerchantValidators', () => {
  describe('taxId', () => {
    const validator = MerchantValidators.taxId();

    it('should accept valid EIN format XX-XXXXXXX', () => {
      expect(validator(new FormControl('12-3456789'))).toBeNull();
    });

    it('should reject invalid EIN format', () => {
      expect(validator(new FormControl('123456789'))).toEqual({ invalidTaxId: true });
      expect(validator(new FormControl('12-345'))).toEqual({ invalidTaxId: true });
    });
  });

  describe('routingNumber', () => {
    const validator = MerchantValidators.routingNumber();

    it('should accept valid 9-digit routing number', () => {
      expect(validator(new FormControl('021000021'))).toBeNull();
      expect(validator(new FormControl('123456789'))).toBeNull();
    });

    it('should reject routing number with fewer than 9 digits', () => {
      expect(validator(new FormControl('12345'))).toEqual({ invalidRoutingNumber: true });
    });

    it('should reject routing number with non-digits', () => {
      expect(validator(new FormControl('12345abcd'))).toEqual({ invalidRoutingNumber: true });
    });
  });

  describe('phone', () => {
    const validator = MerchantValidators.phone();

    it('should accept 10-digit phone with dashes', () => {
      expect(validator(new FormControl('503-555-0101'))).toBeNull();
    });

    it('should reject invalid phone format', () => {
      expect(validator(new FormControl('5550101'))).toEqual({ invalidPhone: true });
    });
  });
});
