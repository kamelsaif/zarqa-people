import { createHandler } from '../_shared/handler.mjs';
Deno.serve(createHandler((name: string) => Deno.env.get(name)));
