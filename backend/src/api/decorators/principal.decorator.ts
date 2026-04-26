import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const user = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user);
const school = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().schoolId);
const roles = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().membership.roles);

export { user as PrincipalUser, school as PrincipalSchool, roles as PrincipalRoles };