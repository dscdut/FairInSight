import { AbstractInputValidatorInterceptor } from './input-validator.interceptor';

export class DefaultValidatorInterceptor extends AbstractInputValidatorInterceptor {
    /**
      * @type {import('joi').ObjectSchema<TSchema>} schema
      */
    schema;
    source;

    /**
      * @param {import('joi').ObjectSchema<TSchema>} schema
      */
    constructor(schema, source = 'body') {
        super();
        this.schema = schema;
        this.source = source;
    }

    /**
     * @override getSchema
     * @implements default we no need to change schema based on request
     */
    // eslint-disable-next-line no-unused-vars
    getSchema(req) {
        return this.schema;
    }

    getValueToValidate(req) {
        switch (this.source) {
            case 'params':
                return req.params;
            case 'query':
                return req.query;
            case 'body':
            default:
                return req.body;
        }
    }
}
