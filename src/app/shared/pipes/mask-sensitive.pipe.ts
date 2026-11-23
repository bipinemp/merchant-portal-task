import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'maskSensitive', standalone: true })
export class MaskSensitivePipe implements PipeTransform {
  transform(value: string | null | undefined, visible: boolean = false, visibleChars: number = 4): string {
    if (!value) return '';
    if (visible) return value;
    if (value.length <= visibleChars) return '•'.repeat(value.length);
    return '•'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }
}
