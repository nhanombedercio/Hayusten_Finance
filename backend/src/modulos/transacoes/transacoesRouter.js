import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './transacoesController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaCriar = z.object({
  contaId: z.string().uuid(),
  categoriaId: z.string().uuid().optional().nullable(),
  tipo: z.enum(['receita', 'despesa']),
  valor: z.number().positive('O valor deve ser positivo.'),
  descricao: z.string().max(500).optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: AAAA-MM-DD).'),
});

const esquemaEditar = esquemaCriar.partial();

router.get('/', ctrl.listar);
router.post('/', validar(esquemaCriar), ctrl.criar);
router.get('/:id', ctrl.buscarPorId);
router.put('/:id', validar(esquemaEditar), ctrl.editar);
router.delete('/:id', ctrl.eliminar);

export default router;
