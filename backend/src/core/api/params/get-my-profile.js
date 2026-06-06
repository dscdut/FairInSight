import { SwaggerDocument } from 'packages/swagger';

export const GetMyProfileParams = SwaggerDocument.ApiParams({
    name: 'id',
    paramsIn: 'path',
    type: 'string',
    description: 'User UUID',
});
