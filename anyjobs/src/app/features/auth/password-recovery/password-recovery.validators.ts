import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { strongPasswordValidator } from '../registration/registration.validators';

export function passwordMatchValidator(passwordKey: string, confirmKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value ?? '';
    const confirm = group.get(confirmKey)?.value ?? '';
    if (!password && !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  };
}

export { strongPasswordValidator };
