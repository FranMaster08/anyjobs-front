import type { Config } from 'tailwindcss';
import preset from './tailwind.preset';

const config: Config = {
  content: ['./src/**/*.{html,ts}', './projects/**/*.{html,ts}'],
  presets: [preset as Config],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

