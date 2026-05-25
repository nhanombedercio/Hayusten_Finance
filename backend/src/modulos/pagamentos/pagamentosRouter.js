import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './pagamentosController.js';

const router = Router();

const esquemaMpesa = z.object({
  msisdn: z.string().min(9).max(15),
  valor: z.number().positive(),
  descricao: z.string().optional(),
});

// Webhook Stripe usa raw body — não precisa de autenticação JWT.
router.post('/stripe/webhook', ctrl.stripeWebhook);

// Callbacks dos gateways locais — validados pela assinatura do gateway, não por JWT.
router.post('/mpesa/callback', ctrl.mpesaCallbackHandler);
router.post('/emola/callback', ctrl.emolaCallbackHandler);

// Rotas autenticadas para iniciar pagamentos.
router.use(autenticacao, tenant);
router.post('/stripe/checkout', ctrl.stripeCheckout);
router.post('/mpesa/iniciar', validar(esquemaMpesa), ctrl.mpesaIniciarHandler);
router.post('/emola/iniciar', validar(esquemaMpesa), ctrl.emolaIniciarHandler);

export default router;
