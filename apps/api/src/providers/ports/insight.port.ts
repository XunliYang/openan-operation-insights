import { OrganizationInsight } from '../../contract/entities';

export type { OrganizationInsight };

export interface InsightQuery {
  orgIds?: string[];
  from?: string;
  to?: string;
}

export interface InsightPort {
  getInsights(query: InsightQuery): Promise<OrganizationInsight[]>;
}
