import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1761660660940 implements MigrationInterface {
    name = 'InitSchema1761660660940';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`purchases\` (\`id\` varchar(36) NOT NULL, \`PurchaseType\` varchar(20) NOT NULL, \`amount\` int NOT NULL, \`price\` decimal(10,2) NOT NULL, \`totalPrice\` decimal(12,2) NOT NULL, \`currency\` varchar(10) NOT NULL DEFAULT 'usd', \`details\` text NULL, \`stripePaymentIntentId\` varchar(100) NOT NULL, \`stripeChargeId\` varchar(100) NULL, \`receiptUrl\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NULL, UNIQUE INDEX \`IDX_97bf8f5a08a2f158046195d40f\` (\`stripePaymentIntentId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
        );
        await queryRunner.query(
            `CREATE TABLE \`vinyls\` (\`id\` varchar(36) NOT NULL, \`price\` decimal(10,2) NULL, \`currency\` varchar(10) NOT NULL DEFAULT 'usd', \`name\` varchar(255) NOT NULL, \`authorName\` varchar(255) NOT NULL, \`description\` text NULL, \`averageScore\` float NOT NULL DEFAULT '0', \`imageUrl\` varchar(255) NULL, \`discogsReleaseId\` int NULL, \`discogsScore\` float NULL, UNIQUE INDEX \`IDX_c687c959b41e5bb5e33461431d\` (\`discogsReleaseId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
        );
        await queryRunner.query(
            `CREATE TABLE \`reviews\` (\`userId\` varchar(255) NOT NULL, \`vinylId\` varchar(255) NOT NULL, \`comment\` text NULL, \`score\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c43b60ce2e5dd83f72cb59dedd\` (\`userId\`, \`vinylId\`), PRIMARY KEY (\`userId\`, \`vinylId\`)) ENGINE=InnoDB`
        );
        await queryRunner.query(
            `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`provider\` varchar(255) NULL, \`providerId\` varchar(255) NULL, \`role\` varchar(255) NOT NULL DEFAULT 'user', \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`birthDate\` datetime NULL, \`avatarUrl\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
        );
        await queryRunner.query(
            `ALTER TABLE \`purchases\` ADD CONSTRAINT \`FK_341f0dbe584866284359f30f3da\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_7ed5659e7139fc8bc039198cc1f\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_824ac8e8ce880d78453bbdca9cb\` FOREIGN KEY (\`vinylId\`) REFERENCES \`vinyls\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`FK_824ac8e8ce880d78453bbdca9cb\``
        );
        await queryRunner.query(
            `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`FK_7ed5659e7139fc8bc039198cc1f\``
        );
        await queryRunner.query(
            `ALTER TABLE \`purchases\` DROP FOREIGN KEY \`FK_341f0dbe584866284359f30f3da\``
        );
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_c43b60ce2e5dd83f72cb59dedd\` ON \`reviews\``
        );
        await queryRunner.query(`DROP TABLE \`reviews\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_c687c959b41e5bb5e33461431d\` ON \`vinyls\``
        );
        await queryRunner.query(`DROP TABLE \`vinyls\``);
        await queryRunner.query(
            `DROP INDEX \`IDX_97bf8f5a08a2f158046195d40f\` ON \`purchases\``
        );
        await queryRunner.query(`DROP TABLE \`purchases\``);
    }
}
