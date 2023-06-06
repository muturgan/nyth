declare const APP_ERROR_SYMBOL: unique symbol;
declare const SCENARIO_FAIL_SYMBOL: unique symbol;
declare const SYSTEM_ERROR_SYMBOL:  unique symbol;
declare const PERMISSIONS_DENIED_SYMBOL:  unique symbol;

export const INTERNAL_ERROR_MESSAGE = 'Internal Server Error';
export const PERMISSIONS_DENIED_MESSAGE = 'Permissions Denied';

export abstract class AppError extends Error {
   // @ts-ignore
   private readonly [APP_ERROR_SYMBOL]: unknown;

   protected constructor(message: string, originalError?: unknown)
   {
      let options: {cause: Error} | undefined;
      if (originalError) {
         options = {cause: originalError as Error};
      }

      // @ts-ignore
      super(message, options);
   }
}

export class ScenarioError extends AppError {
   // @ts-ignore
   private readonly [SCENARIO_FAIL_SYMBOL]: unknown;
   constructor(message: string) {
      super(message);
   }
}

export class PermissionsDeniedError extends AppError {
   // @ts-ignore
   private readonly [PERMISSIONS_DENIED_SYMBOL]: unknown;
   constructor(message: string = PERMISSIONS_DENIED_MESSAGE) {
      super(message);
   }
}

export class SystemError extends AppError {
   // @ts-ignore
   private readonly [SYSTEM_ERROR_SYMBOL]: unknown;
   constructor(rawError: unknown, message: string = INTERNAL_ERROR_MESSAGE) {
      super(message, rawError);
   }
}