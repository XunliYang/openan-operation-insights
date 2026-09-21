import { Controller, Get, Query } from '@nestjs/common';
import { OrganizationCard } from '../../contract/entities';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';
import { OrganizationService } from './organization.service';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /** GET /api/organizations?scope=&type=&keyword= */
  @Get()
  list(@Query() query: ListOrganizationsQueryDto): Promise<OrganizationCard[]> {
    return this.organizationService.listOrganizations(query);
  }
}
