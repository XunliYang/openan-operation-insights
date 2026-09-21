import { OrganizationContribution } from '../../contract/entities';

export type { OrganizationContribution };

export interface ContributionQuery {
  orgIds?: string[];
  /** ISO 8601；阶段一不生效，阶段三由采集器在落盘时决定区间 */
  from?: string;
  to?: string;
}

export interface ContributionPort {
  getContributions(query: ContributionQuery): Promise<OrganizationContribution[]>;
}
