import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { Public } from '~/common/decorators/public.decorator';
import { Roles } from '~/common/decorators/roles.decorator';
import { VinylEntity } from '~/entities/vinyl.entity';
import { CreateVinylDto } from '~/services/vinyl/dto/create-vinyl.dto';
import {
    PublicVinylPaginationResponseDto,
    PublicVinylViewResponseDto,
} from '~/services/vinyl/dto/public-vinyl-view-response.dto';
import { UpdateVinylDto } from '~/services/vinyl/dto/update-vinyl.dto';
import { VinylService } from '~/services/vinyl/vinyl.service';

@ApiTags('Vinyl')
@Controller('vinyl')
export class VinylController {
    constructor(private readonly vinylService: VinylService) {}

    @Roles('admin')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new vinyl record' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Vinyl record successfully created',
        type: VinylEntity,
    })
    async create(@Body() dto: CreateVinylDto): Promise<VinylEntity> {
        return await this.vinylService.create(dto);
    }

    @Roles('admin')
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update an existing vinyl record by ID' })
    @ApiParam({ name: 'id', type: String, description: 'Vinyl ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Vinyl record successfully updated',
        type: VinylEntity,
    })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateVinylDto
    ): Promise<VinylEntity> {
        return await this.vinylService.update(id, dto);
    }

    @Roles('admin')
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a vinyl record by ID' })
    @ApiParam({ name: 'id', type: String, description: 'Vinyl ID' })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Vinyl record successfully deleted',
    })
    async remove(@Param('id') id: string): Promise<void> {
        return await this.vinylService.remove(id);
    }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get a public paginated list of vinyls' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of public vinyls with pagination',
        type: PublicVinylPaginationResponseDto,
    })
    async findAllPublic(
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ): Promise<{
        total: number;
        page: number;
        limit: number;
        data: PublicVinylViewResponseDto[];
    }> {
        return await this.vinylService.findAllPublic(+page, +limit);
    }

    @Public()
    @Get('search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Search and sort vinyl records' })
    @ApiQuery({
        name: 'q',
        required: false,
        type: String,
        description: 'Search term (name or author)',
        example: 'Beatles',
    })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['price', 'name', 'authorName'],
        description: 'Field to sort by',
    })
    @ApiQuery({
        name: 'order',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sorting order',
        example: 'ASC',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of matching vinyl records',
        type: [VinylEntity],
    })
    async searchAndSort(
        @Query('q') query?: string,
        @Query('sortBy') sortBy?: 'price' | 'name' | 'authorName',
        @Query('order') order: 'ASC' | 'DESC' = 'ASC'
    ): Promise<VinylEntity[]> {
        return await this.vinylService.searchAndSort(query, sortBy, order);
    }
}
