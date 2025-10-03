import { json } from 'body-parser';
import { Request } from 'express';

export const stripeRawBody = json({
  type: '*/*',
  verify: (req: Request, _res, buf) => {
    (req as any).rawBody = buf.toString();
  },
});
