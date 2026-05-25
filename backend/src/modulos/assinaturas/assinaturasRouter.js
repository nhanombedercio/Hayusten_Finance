import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './assinaturasController.js';

const router = Router();
router.use(autenticacao, tenant);

const esquemaPlano = z.object({ plano: z.enum(['premium']) });

router.get('/', ctrl.buscarEstado);
router.post('/cancelar', ctrl.cancelar);
router.post('/reactivar', ctrl.reactivar);
router.put('/plano', validar(esquemaPlano), ctrl.alterarPlano);

export default router;
