import { HOST, NODE_ENV, PORT } from 'core/env';
import { SwaggerBuilder } from '../../packages/swagger';

const servers = [
    {
        url: `${HOST}/api/v1`,
        description: 'Server',
        variables: {
            env: {
                default: 'app-dev',
                description: 'Dev Environment',
            },
            port: {
                enum: ['8443', '5000', '443'],
                default: PORT,
            },
            basePath: {
                default: 'api/v1',
            },
        },
    },
];

if (NODE_ENV !== 'production') {
    servers.push({
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Dev Env',
    });
}

const options = {
    openapi: '3.0.1',
    info: {
        version: '1.0.0',
        title: 'APIs Document',
        description: 'API description',
        termsOfService: '',
        contact: {
            name: 'FairInSight',
            email: 'admin@gmail.com',
        },
    },
    servers,
    basePath: '/api/v1',
    auth: true,
};

export const ApiDocument = SwaggerBuilder.builder().addConfig(options);
