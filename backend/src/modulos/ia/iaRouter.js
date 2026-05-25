import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import { limitadorIA } from '../../middlewares/rateLimiting.js';
import * as ctrl from './iaController.js';

const router = Router();
router.use(autenticacao, tenant, limitadorIA);

const esquemaSimular = z.object({
  categoria: z.string().min(1),
  percentagem: z.number().min(1).max(100),
});

const esquemaChat = z.object({
  mensagem: z.string().min(1).max(2000),
  historico: z.array(z.object({
    papel: z.enum(['user', 'assistant']),
    mensagem: z.string(),
  })).optional(),
});

router.get('/score', ctrl.score);
router.get('/previsoes', ctrl.previsoes);
router.get('/projecao', ctrl.projecao);
router.post('/simular', validar(esquemaSimular), ctrl.simular);
router.get('/metas/:metaId/plano', ctrl.planoPoupancaMeta);
router.post('/chat', validar(esquemaChat), ctrl.chat);

export default router;
