import { Router } from 'express';
import { z } from 'zod';
import { validar } from '../../middlewares/validacao.js';
import { limitadorAuth } from '../../middlewares/rateLimiting.js';
import * as ctrl from './authController.js';

const router = Router();

const esquemaRegistar = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(255),
  email: z.string().email('Email inválido.'),
  password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres.'),
});

const esquemaLogin = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'Password obrigatória.'),
});

const esquemaToken = z.object({ token: z.string().min(1) });
const esquemaRefresh = z.object({ refreshToken: z.string().min(1) });
const esquemaEmail = z.object({ email: z.string().email() });
const esquemaRedefinir = z.object({
  token: z.string().min(1),
  novaPassword: z.string().min(8),
});

router.post('/registar', limitadorAuth, validar(esquemaRegistar), ctrl.registar);
router.post('/login', limitadorAuth, validar(esquemaLogin), ctrl.login);
router.post('/logout', validar(esquemaRefresh), ctrl.logout);
router.post('/renovar-token', validar(esquemaRefresh), ctrl.renovarToken);
router.post('/confirmar-email', validar(esquemaToken), ctrl.confirmarEmail);
router.post('/recuperar-password', limitadorAuth, validar(esquemaEmail), ctrl.recuperarPassword);
router.post('/redefinir-password', limitadorAuth, validar(esquemaRedefinir), ctrl.redefinirPassword);

export default router;
