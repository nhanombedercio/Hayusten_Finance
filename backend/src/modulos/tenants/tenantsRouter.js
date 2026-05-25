import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './tenantsController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaActualizar = z.object({
  nome: z.string().min(2).max(100).optional(),
  moedaPrincipal: z.enum(['MZN', 'USD']).optional(),
  relatoriosEmailActivo: z.boolean().optional(),
});

// Rota para o próprio tenant ver e gerir a sua conta.
router.get('/', ctrl.buscar);
router.patch('/', validar(esquemaActualizar), ctrl.actualizar);
router.post('/cancelar', ctrl.cancelar);

export default router;
