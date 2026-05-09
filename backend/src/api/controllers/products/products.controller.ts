import { Controller, Get, Param, Query, ParseUUIDPipe, UseGuards, Post, Body } from '@nestjs/common';
import { JwtGuard, RbacGuard } from '../../guards';
import { PrincipalUser, Roles } from '../../decorators';
import { ViewProductsUseCase, GetProductUseCase, AddProductUseCase } from '../../../application/use-cases/products';
import { AddProductDto } from './products.dto';
import { CursorQuery } from '../../query.dto';

@Controller('products')
@UseGuards(JwtGuard)
export class ProductsController {

	constructor(private readonly addProduct: AddProductUseCase,
	            private readonly viewProducts: ViewProductsUseCase,
	            private readonly getProduct: GetProductUseCase) {}
	@Post()
	@UseGuards(RbacGuard)
	@Roles('PRINTER')
	onAddProduct(@PrincipalUser() { id }: IPrincipal, @Body() body: AddProductDto) {
		return this.addProduct.execute( { userId: id, ...body })
	}

	@Get()
	onViewProducts(@Query() query: CursorQuery) {
		return this.viewProducts.execute({ ...query });
	}

	@Get(':id')
	onGetProduct(@Param('id', ParseUUIDPipe) id: UUID) {
		return this.getProduct.execute({ id })
	}
}