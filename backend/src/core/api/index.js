import { MediaResolver } from 'core/api/media';
import { UserResolver } from 'core/api/user/user.resolver';
import { ApiDocument } from 'core/config/swagger.config';
import { LawyerResolver } from 'core/api/lawyer/lawyer.resolver';
import { UploadResolver } from 'core/api/upload';
import { HandlerResolver } from '../../packages/handler/HandlerResolver';
import { AuthResolver } from './auth/auth.resolver';
import { AnalysisResolver } from './analysis/analysis.resolver';

export const ModuleResolver = HandlerResolver
    .builder()
    .addSwaggerBuilder(ApiDocument)
    .addModule([
        AuthResolver,
        UserResolver,
        MediaResolver,
        LawyerResolver,
        UploadResolver,
        AnalysisResolver
    ]);
