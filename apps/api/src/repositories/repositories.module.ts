import { Global, Logger, Module, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import {
  Contributor,
  HomeFileData,
  SummitDetail,
  Organization,
  OrganizationContribution,
  OrganizationInsight,
  MapSource,
  ManualMapMarker,
} from '../contract/entities';
import { JsonRepository } from './json-repository';
import {
  CONTRIBUTIONS_REPOSITORY,
  CONTRIBUTORS_REPOSITORY,
  HOME_REPOSITORY,
  INSIGHTS_REPOSITORY,
  SUMMITS_REPOSITORY,
  ORGANIZATIONS_REPOSITORY,
  MAP_SOURCES_REPOSITORY,
  MAP_SOURCES_MANUAL_REPOSITORY,
} from './repository.tokens';
import {
  isContributionArray,
  isContributorArray,
  isHomeFileData,
  isInsightArray,
  isSummitDetailArray,
  isOrganizationArray,
  isMapSourceArray,
  isManualMarkerArray,
} from './validators';

type RepositoryFactory<T> = (
  config: ConfigService,
) => JsonRepository<T>;

function makeRepository<T>(
  fileName: string,
  isValidData: (value: unknown) => value is T,
  extra?: { optional?: boolean; cacheTtlMs?: number },
): RepositoryFactory<T> {
  return (config: ConfigService) =>
    new JsonRepository<T>(join(config.getOrThrow<string>('dataDir'), fileName), {
      fileName,
      schemaVersion: 1,
      isValidData,
      optional: extra?.optional,
      cacheTtlMs: extra?.cacheTtlMs,
    });
}

const repositoryProviders = [
  {
    provide: HOME_REPOSITORY,
    useFactory: makeRepository<HomeFileData>('home.json', isHomeFileData),
    inject: [ConfigService],
  },
  {
    provide: ORGANIZATIONS_REPOSITORY,
    useFactory: makeRepository<Organization[]>('organizations.json', isOrganizationArray),
    inject: [ConfigService],
  },
  {
    provide: CONTRIBUTIONS_REPOSITORY,
    useFactory: makeRepository<OrganizationContribution[]>(
      'contributions.json',
      isContributionArray,
    ),
    inject: [ConfigService],
  },
  {
    provide: INSIGHTS_REPOSITORY,
    useFactory: makeRepository<OrganizationInsight[]>('insights.json', isInsightArray),
    inject: [ConfigService],
  },
  {
    provide: CONTRIBUTORS_REPOSITORY,
    useFactory: makeRepository<Contributor[]>('contributors.json', isContributorArray),
    inject: [ConfigService],
  },
  {
    provide: SUMMITS_REPOSITORY,
    useFactory: makeRepository<SummitDetail[]>('summits.json', isSummitDetailArray),
    inject: [ConfigService],
  },
  {
    provide: MAP_SOURCES_REPOSITORY,
    useFactory: makeRepository<MapSource[]>('map-sources.json', isMapSourceArray),
    inject: [ConfigService],
  },
  {
    provide: MAP_SOURCES_MANUAL_REPOSITORY,
    useFactory: makeRepository<ManualMapMarker[]>(
      'map-sources.manual.json',
      isManualMarkerArray,
      { optional: true, cacheTtlMs: 15000 },
    ),
    inject: [ConfigService],
  },
];

/**
 * 启动期数据自检：校验五个业务 JSON 文件的结构合法性。
 * 校验失败不阻断启动（降级只读），由具体接口返回 50001。
 */
export class DataBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DataBootstrapService.name);

  constructor(
    @Inject(HOME_REPOSITORY) private readonly home: JsonRepository<HomeFileData>,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizations: JsonRepository<Organization[]>,
    @Inject(CONTRIBUTIONS_REPOSITORY)
    private readonly contributions: JsonRepository<OrganizationContribution[]>,
    @Inject(INSIGHTS_REPOSITORY) private readonly insights: JsonRepository<OrganizationInsight[]>,
    @Inject(CONTRIBUTORS_REPOSITORY) private readonly contributors: JsonRepository<Contributor[]>,
    @Inject(SUMMITS_REPOSITORY) private readonly summits: JsonRepository<SummitDetail[]>,
    @Inject(MAP_SOURCES_REPOSITORY) private readonly mapSources: JsonRepository<MapSource[]>,
    @Inject(MAP_SOURCES_MANUAL_REPOSITORY)
    private readonly mapSourcesManual: JsonRepository<ManualMapMarker[]>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const repositories = [
      this.home,
      this.organizations,
      this.contributions,
      this.insights,
      this.contributors,
      this.summits,
      this.mapSources,
      this.mapSourcesManual,
    ] as const;

    const results = await Promise.all(
      repositories.map(async (repo) => {
        try {
          await repo.read();
          return { label: repo.label, ok: true };
        } catch (error) {
          this.logger.error(`启动自检失败：${repo.label} → ${(error as Error).message}`);
          return { label: repo.label, ok: false };
        }
      }),
    );

    const failed = results.filter((item) => !item.ok).map((item) => item.label);
    if (failed.length > 0) {
      this.logger.warn(`数据自检未通过（降级只读）：${failed.join(', ')}`);
    } else {
      this.logger.log(`数据自检通过：${results.map((item) => item.label).join(', ')}`);
    }
  }
}

@Global()
@Module({
  providers: [...repositoryProviders, DataBootstrapService],
  exports: [
    HOME_REPOSITORY,
    ORGANIZATIONS_REPOSITORY,
    CONTRIBUTIONS_REPOSITORY,
    INSIGHTS_REPOSITORY,
    CONTRIBUTORS_REPOSITORY,
    SUMMITS_REPOSITORY,
    MAP_SOURCES_REPOSITORY,
    MAP_SOURCES_MANUAL_REPOSITORY,
  ],
})
export class RepositoriesModule {}
