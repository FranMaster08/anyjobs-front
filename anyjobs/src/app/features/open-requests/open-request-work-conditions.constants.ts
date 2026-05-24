export const YES_NO_OPTIONAL_VALUES = ['yes', 'no', 'optional'] as const;
export type YesNoOptional = (typeof YES_NO_OPTIONAL_VALUES)[number];

export const YES_NO_COORDINATE_VALUES = ['yes', 'no', 'to_coordinate'] as const;
export type YesNoCoordinate = (typeof YES_NO_COORDINATE_VALUES)[number];

export const YES_NO_PARTIALLY_VALUES = ['yes', 'no', 'partially'] as const;
export type YesNoPartially = (typeof YES_NO_PARTIALLY_VALUES)[number];

export const YES_NO_DESIRABLE_VALUES = ['yes', 'no', 'desirable'] as const;
export type YesNoDesirable = (typeof YES_NO_DESIRABLE_VALUES)[number];

export const YES_NO_REQUIRES_INSTRUCTIONS_VALUES = ['yes', 'no', 'requires_instructions'] as const;
export type YesNoRequiresInstructions = (typeof YES_NO_REQUIRES_INSTRUCTIONS_VALUES)[number];

export const WORK_CONDITIONS_ADDITIONAL_INSTRUCTIONS_MAX_LENGTH = 500;

export interface WorkConditions {
  readonly ownToolsRequired?: YesNoOptional;
  readonly workerMustTravel?: YesNoCoordinate;
  readonly requesterProvidesMaterials?: YesNoPartially;
  readonly requesterProvidesTools?: YesNoPartially;
  readonly priorExperienceRequired?: YesNoDesirable;
  readonly scheduleFlexible?: YesNoCoordinate;
  readonly priorVisitRequired?: YesNoCoordinate;
  readonly easyAccessOrInstructions?: YesNoRequiresInstructions;
  readonly additionalInstructions?: string;
}

export type WorkConditionEnumKey = Exclude<keyof WorkConditions, 'additionalInstructions'>;

export interface WorkConditionFieldOption {
  readonly value: string;
  readonly label: string;
}

export interface WorkConditionFieldDef {
  readonly key: WorkConditionEnumKey;
  readonly label: string;
  readonly options: readonly WorkConditionFieldOption[];
}

const YES_NO_LABELS: Record<'yes' | 'no', string> = {
  yes: 'Sí',
  no: 'No',
};

export const WORK_CONDITION_FIELD_DEFS: readonly WorkConditionFieldDef[] = [
  {
    key: 'ownToolsRequired',
    label: 'Herramientas propias requeridas',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'optional', label: 'Opcional · No estoy seguro' },
    ],
  },
  {
    key: 'workerMustTravel',
    label: 'El trabajador debe trasladarse al lugar',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'to_coordinate', label: 'A coordinar' },
    ],
  },
  {
    key: 'requesterProvidesMaterials',
    label: 'El solicitante ofrece materiales',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'partially', label: 'Parcialmente' },
    ],
  },
  {
    key: 'requesterProvidesTools',
    label: 'El solicitante ofrece herramientas o equipos',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'partially', label: 'Parcialmente' },
    ],
  },
  {
    key: 'priorExperienceRequired',
    label: 'Se requiere experiencia previa',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'desirable', label: 'Deseable' },
    ],
  },
  {
    key: 'scheduleFlexible',
    label: 'Se permite coordinar horario',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'to_coordinate', label: 'A coordinar' },
    ],
  },
  {
    key: 'priorVisitRequired',
    label: 'El trabajo requiere visita previa',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'to_coordinate', label: 'A coordinar' },
    ],
  },
  {
    key: 'easyAccessOrInstructions',
    label: 'El lugar tiene acceso fácil o instrucciones especiales',
    options: [
      { value: 'yes', label: YES_NO_LABELS.yes },
      { value: 'no', label: YES_NO_LABELS.no },
      { value: 'requires_instructions', label: 'Requiere instrucciones' },
    ],
  },
];

const OPTION_LABEL_BY_FIELD: Record<WorkConditionEnumKey, Record<string, string>> =
  WORK_CONDITION_FIELD_DEFS.reduce(
    (acc, field) => {
      acc[field.key] = Object.fromEntries(field.options.map((o) => [o.value, o.label]));
      return acc;
    },
    {} as Record<WorkConditionEnumKey, Record<string, string>>,
  );

export interface WorkConditionDisplayItem {
  readonly key: WorkConditionEnumKey;
  readonly label: string;
  readonly value: string;
  /** Texto compacto en una línea para la UI tipo amenidades. */
  readonly summary: string;
}

const WORK_CONDITION_SHORT_LABELS: Record<WorkConditionEnumKey, string> = {
  ownToolsRequired: 'Herramientas propias',
  workerMustTravel: 'Traslado al lugar',
  requesterProvidesMaterials: 'Materiales del solicitante',
  requesterProvidesTools: 'Herramientas del solicitante',
  priorExperienceRequired: 'Experiencia previa',
  scheduleFlexible: 'Coordinación de horario',
  priorVisitRequired: 'Visita previa',
  easyAccessOrInstructions: 'Acceso al lugar',
};

export function buildWorkConditionsFromForm(raw: {
  ownToolsRequired: string;
  workerMustTravel: string;
  requesterProvidesMaterials: string;
  requesterProvidesTools: string;
  priorExperienceRequired: string;
  scheduleFlexible: string;
  priorVisitRequired: string;
  easyAccessOrInstructions: string;
  additionalInstructions: string;
}): WorkConditions | undefined {
  const out: Record<string, string> = {};
  for (const field of WORK_CONDITION_FIELD_DEFS) {
    const value = raw[field.key]?.trim() ?? '';
    if (value.length > 0) out[field.key] = value;
  }
  const instructions = raw.additionalInstructions.trim();
  if (instructions.length > 0) out['additionalInstructions'] = instructions;
  return Object.keys(out).length > 0 ? (out as WorkConditions) : undefined;
}

export function hasWorkConditionsData(conditions: WorkConditions | null | undefined): boolean {
  if (!conditions) return false;
  for (const field of WORK_CONDITION_FIELD_DEFS) {
    const value = conditions[field.key];
    if (typeof value === 'string' && value.trim().length > 0) return true;
  }
  const instructions = conditions.additionalInstructions?.trim() ?? '';
  return instructions.length > 0;
}

export function listWorkConditionDisplayItems(
  conditions: WorkConditions,
): readonly WorkConditionDisplayItem[] {
  const items: WorkConditionDisplayItem[] = [];
  for (const field of WORK_CONDITION_FIELD_DEFS) {
    const raw = conditions[field.key];
    if (typeof raw !== 'string' || raw.trim().length === 0) continue;
    const valueLabel = OPTION_LABEL_BY_FIELD[field.key][raw] ?? raw;
    const shortLabel = WORK_CONDITION_SHORT_LABELS[field.key];
    items.push({
      key: field.key,
      label: field.label,
      value: valueLabel,
      summary: `${shortLabel} · ${valueLabel}`,
    });
  }
  return items;
}
