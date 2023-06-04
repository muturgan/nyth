import { ISerializer, defaultSerializer } from './serializer';

export abstract class BaseAdapter
{
   protected readonly serializer: ISerializer;

   constructor(serializer?: ISerializer) {
      this.serializer = serializer || defaultSerializer;
   }
}