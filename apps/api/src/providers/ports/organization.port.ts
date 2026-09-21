import { Organization, OrganizationType } from '../../contract/entities';

export type { Organization, OrganizationType };

export interface ListOrganizationsQuery {
  type?: OrganizationType;
  /** 按名称模糊匹配（大小写不敏感） */
  keyword?: string;
}

export interface OrganizationPort {
  listOrganizations(query: ListOrganizationsQuery): Promise<Organization[]>;
  getOrganizationById(orgId: string): Promise<Organization | null>;
}
