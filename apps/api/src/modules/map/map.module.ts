import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { MapWriteGuard } from './map-write.guard';
import { CacheNoStoreInterceptor } from './cache-no-store.interceptor';

@Module({
  controllers: [MapController],
  providers: [MapService, MapWriteGuard, CacheNoStoreInterceptor],
})
export class MapModule {}