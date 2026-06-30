import { MediaResolver } from 'core/api/media';
import { UserResolver } from 'core/api/user/user.resolver';
import { ApiDocument } from 'core/config/swagger.config';
import { LawyerResolver } from 'core/api/lawyer/lawyer.resolver';
import { UploadResolver } from 'core/api/upload';
import { TemplateResolver } from 'core/api/template';
import { DocumentResolver } from 'core/api/document';
import { HandlerResolver } from '../../packages/handler/HandlerResolver';
import { AuthResolver } from './auth/auth.resolver';
import { LawResolver } from './law/law.resolver';

export const ModuleResolver = HandlerResolver
    .builder()
    .addSwaggerBuilder(ApiDocument)
    .addModule([
        AuthResolver,
        UserResolver,
        MediaResolver,
        LawyerResolver,
        UploadResolver,
        LawResolver,
        TemplateResolver,
        DocumentResolver
    ]);
