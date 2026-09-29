import type { Request, Response } from 'express';

import { app, initializeApp } from '../backend/src/index';

let initialization: Promise<void> | undefined;

export default async function handler(request: Request, response: Response) {
  initialization ??= initializeApp();
  await initialization;
  return app(request, response);
}