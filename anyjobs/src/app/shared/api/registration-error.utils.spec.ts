import { HttpErrorResponse } from '@angular/common/http';

import {
  listRegistrationFieldErrorMessages,
  mapRegistrationErrorToMessage,
  REG_I18N_UNEXPECTED,
} from './registration-error.utils';

describe('mapRegistrationErrorToMessage', () => {
  const t = (key: string) => `t:${key}`;

  it('maps fieldErrors documentType to specific message', () => {
    const msg = mapRegistrationErrorToMessage(
      new HttpErrorResponse({
        status: 400,
        error: {
          errorCode: 'VALIDATION.INVALID_INPUT',
          details: { fieldErrors: { documentType: 'Document type is required for WORKER.' } },
        },
      }),
      t,
    );
    expect(msg).toBe('t:error.docTypeRequired');
  });

  it('uses unexpected message for 5xx', () => {
    const msg = mapRegistrationErrorToMessage(new HttpErrorResponse({ status: 503 }), t);
    expect(msg).toBe(`t:${REG_I18N_UNEXPECTED}`);
  });

  it('lists all field error messages', () => {
    const messages = listRegistrationFieldErrorMessages(
      new HttpErrorResponse({
        status: 400,
        error: {
          details: {
            fieldErrors: {
              birthDate: 'You must be at least 18 years old.',
              nationality: 'Nationality is required for WORKER.',
            },
          },
        },
      }),
      t,
    );
    expect(messages).toEqual(['t:reg.error.birthDateUnderage', 't:reg.error.nationality']);
  });

  it('parses Nest whitelist errors for municipality', () => {
    const messages = listRegistrationFieldErrorMessages(
      new HttpErrorResponse({
        status: 400,
        error: {
          errorCode: 'VALIDATION.INVALID_INPUT',
          details: {
            message: ['location.property municipality should not exist'],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      }),
      t,
    );
    expect(messages).toEqual(['t:reg.error.serverFieldNotSupported']);
  });

  it('parses class-validator nested property paths', () => {
    const messages = listRegistrationFieldErrorMessages(
      new HttpErrorResponse({
        status: 400,
        error: {
          errorCode: 'VALIDATION.INVALID_INPUT',
          details: {
            message: [
              'personalInfo.gender must be one of the following values',
              'location.municipality should not be empty',
            ],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      }),
      t,
    );
    expect(messages).toEqual(['t:reg.error.gender', 't:reg.error.municipalityRequired']);
  });

  it('uses validation message for 400 without fieldErrors', () => {
    const msg = mapRegistrationErrorToMessage(
      new HttpErrorResponse({ status: 400, error: { errorCode: 'VALIDATION.INVALID_INPUT' } }),
      t,
    );
    expect(msg).toBe('t:reg.error.validation');
  });
});
