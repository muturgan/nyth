import { IHandlerValidationFail, IHandlerValidationSuccess } from './typings';

export class HandlerValidationSuccess implements IHandlerValidationSuccess {
   public readonly isValidCallData = true;
   public readonly validationErrorMessage = null;
}

export const HANDLER_VALIDATION_SUCCESS = new HandlerValidationSuccess();

export class HandlerValidationFail implements IHandlerValidationFail {
   public readonly isValidCallData = false;

   constructor(
      public readonly validationErrorMessage: string,
   ) {}

   public static fromError(error: Error): HandlerValidationFail {
      return new HandlerValidationFail(error.message);
   }
}
