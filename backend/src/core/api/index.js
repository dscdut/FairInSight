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
import { AnalysisResolver } from './analysis/analysis.resolver';
import { DraftResolver } from './draft/draft.resolver';
import { ChatRequestResolver } from './chat-request/chat-request.resolver';
import { ConsultationResolver } from './consultation/consultation.resolver';
import { BillingResolver } from './billing/billing.resolver';
import { InternalBillingResolver } from './internal-billing/internal-billing.resolver';
import { ChatGatewayResolver } from './chat-gateway/chat-gateway.resolver';
import { AiGatewayResolver } from './ai-gateway';
import { ReportsResolver } from './reports';

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
        DocumentResolver,
        AnalysisResolver,
        DraftResolver,
        ChatRequestResolver,
        ConsultationResolver,
        BillingResolver,
        InternalBillingResolver,
        ChatGatewayResolver,
        AiGatewayResolver,
        ReportsResolver
    ]);
