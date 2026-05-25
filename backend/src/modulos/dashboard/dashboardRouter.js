import { Router } from 'express';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import { dashboard } from './dashboardController.js';

const router = Router();
router.use(autenticacao, tenant);
router.get('/', dashboard);

export default router;
