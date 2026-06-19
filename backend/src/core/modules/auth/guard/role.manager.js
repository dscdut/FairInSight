import { Role } from 'core/rules';
import { SpecificRoleGuard } from './specificRole.guard';

export const hasAdminRole = new SpecificRoleGuard(Role.ADMIN.name);

// export const hasSuperAdminRole = new SpecificRoleGuard(Role.SUPER_ADMIN);

// export const hasAdminOrSuperAdminRole = new UnionRoleGuard(Role.ADMIN.name, Role.SUPER_ADMIN.namez);
