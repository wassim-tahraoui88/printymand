import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const user = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user);
const role = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().role);

export { user as PrincipalUser, role as PrincipalRole };