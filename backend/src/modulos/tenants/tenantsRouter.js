import { Router } from 'express';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './tenantsController.js';

const router = Router();
router.use(autenticacao, tenant);

// Rota para o próprio tenant ver e gerir a sua conta.
router.get('/minha-conta', ctrl.buscar);
router.post('/cancelar', ctrl.cancelar);

export default router;
