import {
  buildWorkConditionsFromForm,
  hasWorkConditionsData,
  listWorkConditionDisplayItems,
} from './open-request-work-conditions.constants';

describe('open-request-work-conditions.constants', () => {
  const emptyForm = {
    ownToolsRequired: '',
    workerMustTravel: '',
    requesterProvidesMaterials: '',
    requesterProvidesTools: '',
    priorExperienceRequired: '',
    scheduleFlexible: '',
    priorVisitRequired: '',
    easyAccessOrInstructions: '',
    additionalInstructions: '',
  };

  it('buildWorkConditionsFromForm returns undefined when empty', () => {
    expect(buildWorkConditionsFromForm(emptyForm)).toBeUndefined();
  });

  it('buildWorkConditionsFromForm keeps selected values', () => {
    expect(
      buildWorkConditionsFromForm({
        ...emptyForm,
        ownToolsRequired: 'yes',
        additionalInstructions: ' Portería 24h ',
      }),
    ).toEqual({
      ownToolsRequired: 'yes',
      additionalInstructions: 'Portería 24h',
    });
  });

  it('hasWorkConditionsData detects partial data', () => {
    expect(hasWorkConditionsData(undefined)).toBe(false);
    expect(hasWorkConditionsData({ workerMustTravel: 'no' })).toBe(true);
  });

  it('listWorkConditionDisplayItems maps labels in Spanish', () => {
    expect(
      listWorkConditionDisplayItems({
        workerMustTravel: 'to_coordinate',
      }),
    ).toEqual([
      {
        key: 'workerMustTravel',
        label: 'El trabajador debe trasladarse al lugar',
        value: 'A coordinar',
        summary: 'Traslado al lugar · A coordinar',
      },
    ]);
  });
});
