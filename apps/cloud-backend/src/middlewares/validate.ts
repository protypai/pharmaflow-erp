import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Request-body validation middleware. Pass a zod schema; on failure responds 400 with the
 * flattened error. On success it REPLACES req.body with the parsed (and stripped) data so
 * downstream services only ever see whitelisted fields.
 */
export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten(),
    });
  }
  req.body = result.data;
  next();
};
