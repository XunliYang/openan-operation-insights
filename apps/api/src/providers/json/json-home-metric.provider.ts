import { Inject, Injectable } from '@nestjs/common';
import { HomeFileData } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import { HOME_REPOSITORY } from '../../repositories/repository.tokens';
import { HomeMetricPort, HomeMetricsPayload } from '../ports/home-metric.port';

@Injectable()
export class JsonHomeMetricProvider implements HomeMetricPort {
  constructor(
    @Inject(HOME_REPOSITORY) private readonly repository: JsonRepository<HomeFileData>,
  ) {}

  async getHomeMetrics(): Promise<HomeMetricsPayload> {
    const envelope = await this.repository.read();
    return { data: envelope.data, updatedAt: envelope.updatedAt };
  }
}
