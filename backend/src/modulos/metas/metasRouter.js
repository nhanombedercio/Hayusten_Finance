import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './metasController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaCriar = z.object({
  nome: z.string().min(1).max(255),
  valorObjectivo: z.number().positive(),
  dataLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const esquemaEditar = z.object({
  nome: z.string().min(1).max(255).optional(),
  valorObjectivo: z.number().positive().optional(),
  dataLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  estado: z.enum(['activa', 'concluida', 'cancelada']).optional(),
});

const esquemaContribuicao = z.object({
  valor: z.number().positive(),
  descricao: z.string().max(500).optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', ctrl.listar);
router.post('/', validar(esquemaCriar), ctrl.criar);
router.get('/:id', ctrl.buscarPorId);
router.put('/:id', validar(esquemaEditar), ctrl.editar);
router.delete('/:id', ctrl.eliminar);
router.post('/:id/contribuicoes', validar(esquemaContribuicao), ctrl.adicionarContribuicao);
router.get('/:id/contribuicoes', ctrl.listarContribuicoes);
router.delete('/:id/contribuicoes/:contribuicaoId', ctrl.eliminarContribuicao);

export default router;
