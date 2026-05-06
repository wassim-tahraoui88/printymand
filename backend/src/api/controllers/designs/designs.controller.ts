import { Controller, Get, Param, Query, ParseUUIDPipe, UseGuards, Post, Body } from '@nestjs/common';
import { JwtGuard, RbacGuard } from '../../guards';
import { PrincipalUser, Roles } from '../../decorators';
import { ViewDesignsUseCase, GetDesignUseCase, UploadDesignUseCase, GetUploadConfigUseCase } from '../../../application/use-cases/designs';
import { UploadDesignDto } from './designs.dto';
import { CursorQuery } from '../../query.dto';

@Controller('designs')
@UseGuards(JwtGuard)
export class DesignsController {

	constructor(private readonly uploadDesign: UploadDesignUseCase,
	            private readonly getUploadConfig: GetUploadConfigUseCase,
	            private readonly viewDesigns: ViewDesignsUseCase,
	            private readonly getDesign: GetDesignUseCase) {}

	@Get()
	@UseGuards(RbacGuard)
	@Roles('DESIGNER')
	onGetUploadConfig() {
		this.getUploadConfig.execute();
	}

	@Post()
	@UseGuards(RbacGuard)
	@Roles('DESIGNER')
	onUploadDesign(@PrincipalUser() { id }: IPrincipal, @Body() body: UploadDesignDto) {
		this.uploadDesign.execute( { userId: id, ...body })
	}

	@Get()
	onGetDesigns(@Query() query: CursorQuery) {
		return this.viewDesigns.execute({ query });
	}

	@Get(':id')
	onGetDesign(@Param('id', ParseUUIDPipe) id: UUID) {
		return this.getDesign.execute({ id })
	}
}