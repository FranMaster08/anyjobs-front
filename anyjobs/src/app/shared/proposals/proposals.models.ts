export type ProposalStatus = 'SENT';

export interface Proposal {
  readonly id: string;
  readonly requestId: string;
  readonly userId: string;
  readonly author?: {
    readonly name: string;
    readonly subtitle?: string;
    readonly rating?: number; // 0.0–5.0 (demo)
    readonly reviewsCount?: number;
  };
  readonly whoAmI: string;
  readonly message: string;
  readonly estimate: string;
  readonly createdAt: string; // ISO
  readonly status: ProposalStatus;
}

export interface CreateProposalInput {
  readonly requestId: string;
  readonly userId: string;
  readonly authorName?: string;
  readonly authorSubtitle?: string;
  readonly whoAmI: string;
  readonly message: string;
  readonly estimate: string;
}

