import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './categoriasController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaCriar = z.object({
  nome: z.string().min(1).max(255),
  tipo: z.enum(['receita', 'despesa']),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser um código hex válido.').optional(),
  icone: z.string().max(50).optional(),
});

const esquemaEditar = z.object({
  nome: z.string().min(1).max(255).optional(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icone: z.string().max(50).optional(),
  activa: z.boolean().optional(),
});

router.get('/', ctrl.listar);
router.post('/', validar(esquemaCriar), ctrl.criar);
router.get('/:id', ctrl.buscarPorId);
router.put('/:id', validar(esquemaEditar), ctrl.editar);
router.delete('/:id', ctrl.eliminar);

export default router;
