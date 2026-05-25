import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './utilizadoresController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaCriar = z.object({
  nome: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  papel: z.enum(['proprietario', 'membro']).optional(),
});

const esquemaEditar = z.object({
  nome: z.string().min(2).max(255).optional(),
  papel: z.enum(['proprietario', 'membro']).optional(),
  activo: z.boolean().optional(),
});

const esquemaPerfil = z.object({ nome: z.string().min(2).max(255) });

const esquemaPassword = z.object({
  passwordActual: z.string().min(1),
  novaPassword: z.string().min(8),
});

router.get('/', ctrl.listar);
router.post('/', validar(esquemaCriar), ctrl.criar);
router.get('/:id', ctrl.buscarPorId);
router.put('/:id', validar(esquemaEditar), ctrl.editar);
router.delete('/:id', ctrl.eliminar);
router.put('/perfil', validar(esquemaPerfil), ctrl.actualizarPerfil);
router.put('/perfil/password', validar(esquemaPassword), ctrl.alterarPassword);

export default router;
