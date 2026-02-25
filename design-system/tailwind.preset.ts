import type { Config } from 'tailwindcss';

export const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ...{
  "text-primary": "rgb(34, 34, 34)",
  "bg-page": "rgb(255, 255, 255)",
  "border-default": "0px none rgb(34, 34, 34)",
  "action-primary": "#FF385C",
  "neutral": {
    "neutral-1": "#000000",
    "neutral-2": "#222222",
    "neutral-3": "#FFFFFF",
    "neutral-4": "#FF385C",
    "neutral-5": "#F7F7F7"
  },
  "brand": {
    "palette-rausch": "#FF385C",
    "palette-productRausch": "#E00B41",
    "palette-plus": "#92174D",
    "palette-luxe": "#460479"
  }
},
      },
      fontFamily: {
        sans: [
  "Airbnb Cereal VF",
  "Circular",
  "-apple-system",
  "BlinkMacSystemFont",
  "Roboto",
  "Helvetica Neue",
  "sans-serif"
],
      },
      fontSize: {
  "h1": [
    "28px",
    {
      "lineHeight": "40.040001px",
      "fontWeight": "700",
      "letterSpacing": "normal",
      "textTransform": "none"
    }
  ],
  "h2": [
    "14px",
    {
      "lineHeight": "20.02px",
      "fontWeight": "400",
      "letterSpacing": "normal",
      "textTransform": "none"
    }
  ],
  "h3": [
    "14px",
    {
      "lineHeight": "18px",
      "fontWeight": "500",
      "letterSpacing": "normal",
      "textTransform": "none"
    }
  ]
},
      borderRadius: {
  "tiny": "4px",
  "sm": "8px",
  "md": "12px",
  "lg": "16px",
  "xl": "20px",
  "2xl": "28px",
  "3xl": "32px"
},
      boxShadow: {
  "high": "0 8px 28px rgba(0,0,0,0.28)",
  "primary": "0 6px 20px rgba(0,0,0,0.2)",
  "secondary": "0 6px 16px rgba(0,0,0,0.12)",
  "tertiary": "0 2px 4px rgba(0,0,0,0.18)",
  "elevation0": "0px 0px 0px 1px #DDDDDD inset",
  "elevation1": "0px 0px 0px 1px rgba(0,0,0,0.02),0px 2px 4px 0px rgba(0,0,0,0.16)",
  "elevation2": "0px 0px 0px 1px rgba(0,0,0,0.02),0px 2px 6px 0px rgba(0,0,0,0.04),0px 4px 8px 0px rgba(0,0,0,0.10)",
  "elevation3": "0px 0px 0px 1px rgba(0,0,0,0.02),0px 8px 24px 0px rgba(0,0,0,0.10)",
  "elevation4": "0px 0px 0px 1px rgba(0,0,0,0.02),0px 4px 8px 0px rgba(0,0,0,0.08),0px 12px 30px 0px rgba(0,0,0,0.12)",
  "elevation5": "0px 0px 0px 1px rgba(0,0,0,0.02),0px 6px 8px 0px rgba(0,0,0,0.10),0px 16px 56px 0px rgba(0,0,0,0.18)"
},
      transitionDuration: {
  "fast": "451.75438596491193ms",
  "standard": "583.7719298245607ms",
  "medium-bounce": "574.1228070175433ms",
  "fast-bounce": "449.12280701754327ms",
  "slow": "745.6140350877179ms",
  "slow-bounce": "762.2807017543847ms"
},
      transitionTimingFunction: {
  "standard": "cubic-bezier(0.2,0,0,1)",
  "enter": "cubic-bezier(0.1,0.9,0.2,1)",
  "exit": "cubic-bezier(0.4,0,1,1)",
  "linear": "cubic-bezier(0,0,1,1)"
},
    },
  },
};

export default preset;
