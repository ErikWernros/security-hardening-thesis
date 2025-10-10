/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-21
 * Design Name: apiRoutes.ts
 * Tools: JWT, express
 * Description:
 * This file contains the authentication middleware for protecting routes.
 * It checks if the user is authenticated and has the required role to access the
 * route.
 * The middleware uses JWT for authentication and ensures type safety with
 * TypeScript.
 * It also includes a type guard to validate the user role.
 * The middleware is used in the API routes to secure access to protected
 * resources.
 * It is designed to work seamlessly with the authentication controller and the API
 * routes.
 * -----------------------------------------------------------
 */
import { Router, Request, Response } from 'express';
import { protectedRoute } from '../middleware/auth';
import * as dataController from '../controllers/dataController';
import * as delController from '../controllers/delController';
import * as avsnittController from '../controllers/avsnittController';
import * as omradeController from '../controllers/omradeController';
import * as kravController from '../controllers/kravController';
import * as svarController from '../controllers/svarController';
import * as styckeController from '../controllers/styckeController';
import { validate } from '../middleware/validate';

import { createDelSchema, updateDelSchema, deleteDelSchema } from '../schemas/del.schema';
import {
  createAvsnittSchema,
  updateAvsnittSchema,
  deleteAvsnittSchema,
} from '../schemas/avsnitt.schema';
import {
  createOmradeSchema,
  updateOmradeSchema,
  deleteOmradeSchema,
} from '../schemas/omrade.schema';
import {
  createStyckeSchema,
  updateStyckeSchema,
  deleteStyckeSchema,
} from '../schemas/stycke.schema';
import { createKravSchema, updateKravSchema, deleteKravSchema } from '../schemas/krav.schema';
import { svarSchema } from '../schemas/svar.schema';
import multer from 'multer';
const upload = multer();

const apiRouter = Router();

apiRouter.post(
  '/data/import',
  upload.single('file'),
  protectedRoute(['Admin']),
  dataController.importFromExcel
);

apiRouter.get(
  '/profile',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  (req: Request, res: Response) => {
    if (req.user) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: 'Unauthenticated user.' });
    }
  }
);

apiRouter.get(
  '/assessor-data',
  protectedRoute(['Admin', 'Assessor']),
  (req: Request, res: Response) => {
    res.json({
      message: `Hi, ${req.user?.email}. You have access to the Advisor data.`,
      role: req.user?.role,
    });
  }
);

apiRouter.get('/admin-data', protectedRoute(['Admin']), (req: Request, res: Response) => {
  res.json({
    message: '¡Welcome to the Administrator control panel!',
    timestamp: new Date().toISOString(),
    role: req.user?.role,
  });
});

/** DEL */
apiRouter.get('/del', protectedRoute(['Admin', 'Assessor', 'Viewer']), delController.getDelList);

// ✅ NY ROUTE: Aggregate data för diagram
apiRouter.get(
  '/del/aggregate',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  delController.getDelAggregate
);

apiRouter.post(
  '/del',
  protectedRoute(['Admin']),
  validate(createDelSchema),
  delController.createDel
);

apiRouter.put(
  '/del/:id',
  protectedRoute(['Admin']),
  validate(updateDelSchema),
  delController.updateDel
);

apiRouter.delete(
  '/del/:id',
  protectedRoute(['Admin']),
  validate(deleteDelSchema),
  delController.deleteDel
);

/** AVSNITT */
apiRouter.get(
  '/avsnitt',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  avsnittController.getAvsnittList
);

apiRouter.post(
  '/avsnitt',
  protectedRoute(['Admin']),
  validate(createAvsnittSchema),
  avsnittController.createAvsnitt
);

apiRouter.put(
  '/avsnitt/:id',
  protectedRoute(['Admin']),
  validate(updateAvsnittSchema),
  avsnittController.updateAvsnitt
);

apiRouter.delete(
  '/avsnitt/:id',
  protectedRoute(['Admin']),
  validate(deleteAvsnittSchema),
  avsnittController.deleteAvsnitt
);

/** OMRADE */
// Automatic tree expansion
apiRouter.get(
  '/omrade:id/parents',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  omradeController.getOmradeParents
);

apiRouter.get(
  '/omrade',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  omradeController.getOmradeListByAvsnitt
);

apiRouter.get(
  '/omrade',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  omradeController.getOmradeListByDel
);

apiRouter.post(
  '/omrade',
  protectedRoute(['Admin']),
  validate(createOmradeSchema),
  omradeController.createOmrade
);

apiRouter.put(
  '/omrade/:id',
  protectedRoute(['Admin']),
  validate(updateOmradeSchema),
  omradeController.updateOmrade
);

apiRouter.delete(
  '/omrade/:id',
  protectedRoute(['Admin']),
  validate(deleteOmradeSchema),
  omradeController.deleteOmrade
);

/** STYCKE */
// Automatic tree expansion
apiRouter.get(
  '/stycke/:id/parents',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  styckeController.getStyckeParents
);

apiRouter.get(
  '/stycke',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  styckeController.getStyckeListByOmrade
);

apiRouter.post(
  '/stycke',
  protectedRoute(['Admin']),
  validate(createStyckeSchema),
  styckeController.createStycke
);

apiRouter.put(
  '/stycke/:id',
  protectedRoute(['Admin']),
  validate(updateStyckeSchema),
  styckeController.updateStycke
);

apiRouter.delete(
  '/stycke/:id',
  protectedRoute(['Admin']),
  validate(deleteStyckeSchema),
  styckeController.deleteStycke
);

/** KRAV */
apiRouter.get('/krav', protectedRoute(['Admin', 'Assessor', 'Viewer']), kravController.getKravList);

apiRouter.post(
  '/krav',
  protectedRoute(['Admin']),
  validate(createKravSchema.shape),
  kravController.createKrav
);

apiRouter.put(
  '/krav/:id',
  protectedRoute(['Admin']),
  validate(updateKravSchema.shape),
  kravController.updateKrav
);

apiRouter.delete(
  '/krav/:id',
  protectedRoute(['Admin']),
  validate(deleteKravSchema.shape),
  kravController.deleteKrav
);

/** SVAR */
// Traffic light type indicators
apiRouter.get(
  '/svar/stycke/:styckeId',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  svarController.getSvarByStycke
);

apiRouter.get(
  '/svar/avsnitt/:avsnittId',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  svarController.getSvarByAvsnitt
);

apiRouter.get(
  '/svar/omrade/:omradeId',
  protectedRoute(['Admin', 'Assessor', 'Viewer']),
  svarController.getSvarByOmrade
);

// Saving responses (autosave by row)
apiRouter.put(
  '/svar/:kravId',
  protectedRoute(['Admin', 'Assessor']),
  validate({ body: svarSchema }),
  svarController.saveSvar
);

export default apiRouter;
