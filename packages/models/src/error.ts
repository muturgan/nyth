export const INTERNAL_ERROR_MESSAGE = 'Internal Server Error';
export const PERMISSIONS_DENIED_MESSAGE = 'Permissions Denied';

export abstract class AppError extends Error {
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
   constructor(message: string) {
      super(message);
   }
}

export class PermissionsDeniedError extends AppError {
   constructor(message: string = PERMISSIONS_DENIED_MESSAGE) {
      super(message);
   }
}

export class SystemError extends AppError {
   constructor(rawError: unknown, message: string = INTERNAL_ERROR_MESSAGE) {
      super(message, rawError);
   }
}