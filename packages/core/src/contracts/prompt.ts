import type { Schema } from '../schema';

export interface PromptSpec<P = unknown> {
  name: string;
  template: string;
  params?: Schema<P>;
}
