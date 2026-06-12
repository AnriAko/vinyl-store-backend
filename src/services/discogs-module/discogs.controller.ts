import { Controller, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DiscogsService } from './discogs.service';
import { UserRole } from '~/entities/user.entity';
import { Roles } from '~/common/decorators/roles.decorator';
import { VinylEntity } from '~/entities/vinyl.entity';

@ApiTags('Discogs')
@Controller('vinyl')
export class DiscogsController {
    constructor(private readonly discogsService: DiscogsService) {}

    @Roles(UserRole.ADMIN)
    @Post('discog/:releaseId')
    @ApiOperation({
        summary: 'Add vinyl record by Discogs release ID',
        description:
            'Allows administrators to import a vinyl record from Discogs using its release ID.',
    })
    @ApiParam({
        name: 'releaseId',
        description: 'Discogs release ID',
        example: 249504,
        type: Number,
    })
    @ApiResponse({
        status: 201,
        description: 'Vinyl record successfully added from Discogs.',
        type: VinylEntity,
    })
    @ApiResponse({
        status: 400,
        description:
            'Invalid release ID or the record already exists in the database.',
    })
    @ApiResponse({
        status: 500,
        description: 'Error from Discogs API or internal server error.',
    })
    async addFromDiscogs(@Param('releaseId', ParseIntPipe) releaseId: number) {
        return this.discogsService.addByDiscogsId(releaseId);
    }
}
