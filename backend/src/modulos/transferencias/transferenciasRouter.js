import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './transferenciasController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaCriar = z.object({
  contaOrigemId: z.string().uuid(),
  contaDestinoId: z.string().uuid(),
  valor: z.number().positive(),
  descricao: z.string().max(500).optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', ctrl.listar);
router.post('/', validar(esquemaCriar), ctrl.criar);
router.get('/:id', ctrl.buscarPorId);
router.delete('/:id', ctrl.eliminar);

export default router;
