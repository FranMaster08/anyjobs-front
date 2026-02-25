import { describe, expect, it } from 'vitest';

import preset from '../../tailwind.preset';

describe('tailwind preset (evidence-derived)', () => {
  it('contains required semantic colors', () => {
    const colors = preset.theme?.extend?.colors as Record<string, unknown> | undefined;
    expect(colors).toBeTruthy();
    expect(colors?.['text-primary']).toBe('rgb(34, 34, 34)');
    expect(colors?.['bg-page']).toBe('rgb(255, 255, 255)');
    expect(colors?.['action-primary']).toBe('#FF385C');
  });

  it('snapshot', () => {
    expect(preset).toMatchSnapshot();
  });
});

