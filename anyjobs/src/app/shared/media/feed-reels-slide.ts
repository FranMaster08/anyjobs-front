import type { SlideData } from 'ngx-vertical-slider';

export type ReelSlide = SlideData & {
  readonly id?: string;
  readonly creatorUserId?: string;
};
