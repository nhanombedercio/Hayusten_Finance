import { Router } from 'express';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './insightsController.js';

const router = Router();
router.use(autenticacao, tenant);

router.get('/', ctrl.listar);
router.post('/marcar-lido/:id', ctrl.marcarLido);
router.post('/gerar', ctrl.gerar);

export default router;
