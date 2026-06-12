import { PartialType } from '@nestjs/mapped-types';
import { CreateVinylDto } from '~/services/vinyl/dto/create-vinyl.dto';

export class UpdateVinylDto extends PartialType(CreateVinylDto) {}
