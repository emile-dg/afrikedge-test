import {SetMetadata} from '@nestjs/common';
import {PERMISSION_METADATA} from './authorization.types';
import type {Permission} from './authorization.types';

export const RequirePermission = (permission: Permission) => SetMetadata(PERMISSION_METADATA, permission);
