import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityModule } from './modules/activity/activity.module';
import { HomeModule } from './modules/home/home.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { SummitModule } from './modules/summit/summit.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { MapModule } from './modules/map/map.module';
import { CommonModule } from './common/common.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { ProvidersModule } from './providers/providers.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    CommonModule,
    RepositoriesModule,
    ProvidersModule,
    HomeModule,
    OrganizationModule,
    ActivityModule,
    SummitModule,
    MapModule,
    MeetingModule,
  ],
})
export class AppModule {}
