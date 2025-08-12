// validate.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, ZodObject, ZodRawShape } from 'zod';

type SchemaShape = {
  body?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
  params?: ZodObject<ZodRawShape>;
};

/**
 * Generic middleware with direct schema inference using ZodObject.
 * Avoid `any` and `AnyZodObject` completely.
 */
export const validate = <T extends SchemaShape>(schema: T): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        const parsedBody = await schema.body.parseAsync(req.body);
        req.validatedBody = parsedBody;
      }

      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        req.validatedQuery = parsedQuery;
      }

      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);
        req.validatedParams = parsedParams;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.issues,
        });
      }
      next(error);
    }
  };
};
