import { MigrationInterface, QueryRunner } from 'typeorm';
import axios from 'axios';
const { v4: uuidv4 } = require('uuid');
import 'dotenv/config';

export class SeedDiscogsVinyls1761660756041 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const token = process.env.DISCOGS_TOKEN;
        if (!token) throw new Error('Missing DISCOGS_TOKEN in .env');

        const headers = { Authorization: `Discogs token=${token}` };
        const queries = [
            'Nirvana',
            'Queen',
            'Radiohead',
            'Daft Punk',
            'The Beatles',
        ];
        const MAX_VINYLS = 50;
        const vinylsToInsert: any[] = [];

        console.log('Starting Discogs vinyls migration...');

        for (const query of queries) {
            if (vinylsToInsert.length >= MAX_VINYLS) break;

            console.log(`Fetching releases for "${query}"...`);

            const { data } = await axios.get(
                'https://api.discogs.com/database/search',
                {
                    headers,
                    params: { q: query, type: 'release' },
                }
            );

            const subset = data.results.slice(0, 10);

            for (const release of subset) {
                if (vinylsToInsert.length >= MAX_VINYLS) break;

                try {
                    const { data: releaseData } = await axios.get(
                        `https://api.discogs.com/releases/${release.id}`,
                        { headers }
                    );

                    const d = releaseData;

                    const id = uuidv4();
                    const name = d.title;
                    const authorName =
                        d.artists?.map((a: any) => a.name).join(', ') ??
                        'Unknown Artist';
                    const description = d.notes || '';
                    const price = Math.floor(Math.random() * 30 + 10);
                    const currency = 'usd';
                    const imageUrl = d.images?.[0]?.uri || null;
                    const discogsReleaseId = d.id;

                    vinylsToInsert.push([
                        id,
                        name,
                        authorName,
                        description,
                        price,
                        currency,
                        0,
                        imageUrl,
                        discogsReleaseId,
                    ]);

                    console.log(
                        `Prepared "${name}" by ${authorName} (${vinylsToInsert.length}/${MAX_VINYLS})`
                    );
                } catch (e: any) {
                    console.warn(`Failed ${release.id}: ${e.message}`);
                }
            }
        }

        if (vinylsToInsert.length === 0) {
            console.log('No vinyls to insert.');
            return;
        }

        console.log(
            `Inserting ${vinylsToInsert.length} vinyls into database...`
        );

        const valuesSql = vinylsToInsert
            .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .join(', ');

        const flattened = vinylsToInsert.flat();

        await queryRunner.query(
            `INSERT INTO vinyls (id, name, authorName, description, price, currency, averageScore, imageUrl, discogsReleaseId)
             VALUES ${valuesSql}`,
            flattened
        );

        console.log(
            `Discogs seeding completed. Imported ${vinylsToInsert.length} vinyls total.`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Removing seeded Discogs vinyls...');
        await queryRunner.query(
            `DELETE FROM vinyls WHERE discogsReleaseId IS NOT NULL`
        );
        console.log('Discogs vinyls removed.');
    }
}
