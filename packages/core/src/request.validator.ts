import Validator, { ValidationSchema, SyncCheckFunction } from 'fastest-validator';
import { IRpcRequest } from '@nyth/models';

const V = new Validator();

const schema: ValidationSchema<Omit<IRpcRequest, 'payload'>> = {
   method: { type: 'string', empty: false },
   correlationId: [
      { type: 'string', optional: true, nullable: true },
      { type: 'number', optional: true, nullable: true },
   ],
   requestId: [
      { type: 'string', optional: true, nullable: true },
      { type: 'number', optional: true, nullable: true },
   ],
   timestamp: { type: 'number', positive: true, integer: true, optional: true, nullable: true },
};

export const validateRequest = V.compile(schema) as SyncCheckFunction;
