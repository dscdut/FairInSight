import Joi from 'joi';

export class DynamicSchemaGenerator {
    /**
     * Generates a Joi schema for validating the `content` object.
     * @param {Array} fields - The template fields (array of sections containing inputs)
     * @returns {Joi.ObjectSchema}
     */
    static generateJoiSchema(fields) {
        if (!fields || !Array.isArray(fields)) {
            return Joi.object().keys({});
        }

        const schemaKeys = {};

        fields.forEach(section => {
            if (section.inputs && Array.isArray(section.inputs)) {
                section.inputs.forEach(input => {
                    let validator = Joi.string();

                    switch (input.type) {
                        case 'date':
                            validator = Joi.string()
                                .regex(/^\d{4}-\d{2}-\d{2}$/)
                                .message(`"${input.label || input.key}" must be in YYYY-MM-DD format`);
                            break;
                        case 'number':
                            validator = Joi.alternatives().try(
                                Joi.number(),
                                Joi.string().regex(/^[\d,.-]+$/).message(`"${input.label || input.key}" must be a valid number representation`)
                            );
                            break;
                        case 'email':
                            validator = Joi.string().email();
                            break;
                        case 'boolean':
                            validator = Joi.boolean();
                            break;
                        default:
                            validator = Joi.string().allow('');
                    }

                    if (input.required) {
                        validator = validator.required();
                    } else {
                        validator = validator.optional().allow(null, '');
                    }

                    schemaKeys[input.key] = validator;
                });
            }
        });

        return Joi.object().keys(schemaKeys);
    }

    /**
     * Generates a JSON Schema (draft-07) for the template fields.
     * @param {string} title - The template title/name
     * @param {Array} fields - The template fields
     * @returns {Object}
     */
    static generateJsonSchema(title, fields) {
        const jsonSchema = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: title || 'Template Schema',
            type: 'object',
            properties: {},
            required: []
        };

        if (!fields || !Array.isArray(fields)) {
            return jsonSchema;
        }

        fields.forEach(section => {
            if (section.inputs && Array.isArray(section.inputs)) {
                section.inputs.forEach(input => {
                    const prop = {
                        title: input.label || input.key,
                        type: 'string'
                    };

                    if (input.defaultValue !== undefined) {
                        prop.default = input.defaultValue;
                    }

                    switch (input.type) {
                        case 'number':
                            prop.type = 'number';
                            break;
                        case 'date':
                            prop.type = 'string';
                            prop.format = 'date';
                            break;
                        case 'email':
                            prop.type = 'string';
                            prop.format = 'email';
                            break;
                        case 'boolean':
                            prop.type = 'boolean';
                            break;
                    }

                    jsonSchema.properties[input.key] = prop;

                    if (input.required) {
                        jsonSchema.required.push(input.key);
                    }
                });
            }
        });

        return jsonSchema;
    }
}
