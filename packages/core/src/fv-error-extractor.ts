import { ValidationError } from 'fastest-validator';

export const parseFvValidatorErrors = (errors: ValidationError[]): string => {
   return errors.map((er) => er.message).join(' ');
};
