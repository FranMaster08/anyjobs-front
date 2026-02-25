export interface SiteConfig {
  readonly brandName: string;
  readonly hero: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly sections: {
    readonly requests: {
      readonly label: string;
      readonly title: string;
      readonly cta: string;
    };
    readonly location: {
      readonly label: string;
      readonly title: string;
      readonly body: string;
      readonly openMap: string;
      readonly viewMap: string;
      readonly preview: {
        readonly title: string;
        readonly hintNoLocation: string;
        readonly hintWithLocation: string;
      };
    };
    readonly contact: {
      readonly label: string;
      readonly title: string;
      readonly intro: string;
      readonly phone: {
        readonly label: string;
        readonly value: string;
        readonly hint: string;
        readonly href: string;
      };
      readonly email: {
        readonly label: string;
        readonly value: string;
        readonly hint: string;
        readonly href: string;
      };
    };
  };
}

