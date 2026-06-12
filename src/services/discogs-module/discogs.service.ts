import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { VinylService } from '~/services/vinyl/vinyl.service';
import { CreateVinylDto } from '~/services/vinyl/dto/create-vinyl.dto';

@Injectable()
export class DiscogsService {
    private readonly token: string;

    constructor(
        private readonly vinylService: VinylService,
        private readonly configService: ConfigService
    ) {
        const token = this.configService.get<string>('discogs.token');
        if (!token) {
            throw new InternalServerErrorException(
                'Missing Discogs token in configuration'
            );
        }
        this.token = token;
    }

    private get headers() {
        return { Authorization: `Discogs token=${this.token}` };
    }

    async addByDiscogsId(releaseId: number) {
        if (!releaseId) throw new BadRequestException('Release ID is required');

        const existing = await this.vinylService.searchAndSort();
        if (existing.some((v) => v.discogsReleaseId === releaseId)) {
            throw new BadRequestException(
                'This Discogs release already exists in the database'
            );
        }

        const { data } = await axios.get(
            `https://api.discogs.com/releases/${releaseId}`,
            { headers: this.headers }
        );

        const dto: CreateVinylDto = {
            name: data.title,
            authorName:
                data.artists?.map((a: any) => a.name).join(', ') ??
                'Unknown Artist',
            description: data.notes || '',
            price: Math.floor(Math.random() * 30 + 10),
            currency: 'usd',
            imageUrl: data.images?.[0]?.uri || null,
            discogsReleaseId: data.id,
            discogsScore: data.community?.rating?.average ?? null,
        };

        return this.vinylService.create(dto);
    }

    async searchDiscogs(query: string, limit = 10) {
        if (!query) throw new BadRequestException('Query string is required');

        const { data } = await axios.get(
            'https://api.discogs.com/database/search',
            {
                headers: this.headers,
                params: { q: query, type: 'release', per_page: limit },
            }
        );

        return data.results.map((r: any) => ({
            id: r.id,
            title: r.title,
            year: r.year,
            thumb: r.thumb,
            genre: r.genre,
            style: r.style,
        }));
    }
}
