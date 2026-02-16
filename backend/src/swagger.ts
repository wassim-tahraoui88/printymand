import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { readFileSync } from 'fs';
import { parse } from 'yamljs';

export default function setup(app: INestApplication) {
    const customCss = readFileSync(join(process.cwd(), 'resources', 'swagger-ui.css'), 'utf8');
    const document = parse(readFileSync(join(process.cwd(), 'api.yaml'), 'utf8'));
    SwaggerModule.setup('docs', app, document, { customCss });
}