import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './contasController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaCriar = z.object({
  nome: z.string().min(1).max(255),
  tipo: z.enum(['banco', 'dinheiro', 'mobile_money']),
  saldoInicial: z.number().optional(),
  moeda: z.enum(['MZN', 'USD']).optional(),
  ordem: z.number().int().optional(),
});

const esquemaEditar = z.object({
  nome: z.string().min(1).max(255).optional(),
  tipo: z.enum(['banco', 'dinheiro', 'mobile_money']).optional(),
  saldoInicial: z.number().optional(),
  moeda: z.enum(['MZN', 'USD']).optional(),
  ordem: z.number().int().optional(),
  activa: z.boolean().optional(),
});

const esquemaReordenar = z.object({
  ordem: z.array(z.object({ id: z.string().uuid(), ordem: z.number().int() })),
});

router.get('/', ctrl.listar);
router.post('/', validar(esquemaCriar), ctrl.criar);
router.put('/reordenar', validar(esquemaReordenar), ctrl.reordenar);
router.get('/:id', ctrl.buscarPorId);
router.put('/:id', validar(esquemaEditar), ctrl.editar);
router.delete('/:id', ctrl.eliminar);

export default router;
