import { MaskSensitivePipe } from './mask-sensitive.pipe';

describe('MaskSensitivePipe', () => {
  const pipe = new MaskSensitivePipe();

  it('should mask all but last 4 characters by default', () => {
    expect(pipe.transform('1234567890')).toBe('••••••7890');
  });

  it('should reveal value when visible is true', () => {
    expect(pipe.transform('1234567890', true)).toBe('1234567890');
  });

  it('should handle short strings', () => {
    expect(pipe.transform('123')).toBe('•••');
  });

  it('should handle empty or null values', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
