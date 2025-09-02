import { ZodArray, ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

const validate = (schema: ZodObject | ZodArray) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      return res.status(400).json({
        errors: err.errors.map((e: any) => ({
          path: e.path.join("."),
          message: e.message
        }))
      });
    }
};

export default validate;
