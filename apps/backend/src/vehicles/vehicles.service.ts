import {Injectable} from '@nestjs/common';
import {VehiclesRepository} from './vehicles.repository';
import type {TVehicle} from "@shared/types";

@Injectable()
export class VehiclesService {
    constructor(private readonly repository: VehiclesRepository) {
    }

    findAllActive(): Promise<TVehicle[]> {
        return this.repository.findAllActive();
    }
}
