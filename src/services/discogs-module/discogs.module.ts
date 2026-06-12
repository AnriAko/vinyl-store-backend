import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscogsService } from './discogs.service';
import { DiscogsController } from './discogs.controller';
import { VinylModule } from '~/services/vinyl/vinyl.module';
import discogsConfig from '~/services/discogs-module/config/discogs.config';

@Module({
    imports: [ConfigModule.forFeature(discogsConfig), VinylModule],
    controllers: [DiscogsController],
    providers: [DiscogsService],
    exports: [DiscogsService],
})
export class DiscogsModule {}
