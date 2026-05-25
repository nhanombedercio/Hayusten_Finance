import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import * as Sentry from '@sentry/node';

import { limitadorGeral } from './middlewares/rateLimiting.js';
import { tratamentoErros } from './middlewares/tratamentoErros.js';

import authRouter from './modulos/auth/authRouter.js';
import utilizadoresRouter from './modulos/utilizadores/utilizadoresRouter.js';
import tenantsRouter from './modulos/tenants/tenantsRouter.js';
import contasRouter from './modulos/contasFinanceiras/contasRouter.js';
import categoriasRouter from './modulos/categorias/categoriasRouter.js';
import transacoesRouter from './modulos/transacoes/transacoesRouter.js';
import transferenciasRouter from './modulos/transferencias/transferenciasRouter.js';
import metasRouter from './modulos/metas/metasRouter.js';
import insightsRouter from './modulos/insights/insightsRouter.js';
import iaRouter from './modulos/ia/iaRouter.js';
import dashboardRouter from './modulos/dashboard/dashboardRouter.js';
import assinaturasRouter from './modulos/assinaturas/assinaturasRouter.js';
import pagamentosRouter from './modulos/pagamentos/pagamentosRouter.js';
import relatoriosRouter from './modulos/relatorios/relatoriosRouter.js';
import adminRouter from './modulos/admin/adminRouter.js';

// Sentry deve ser inicializado antes de qualquer outro middleware para capturar todos os erros.
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
}

const app = express();

// Helmet como primeiro middleware de segurança — define headers HTTP de protecção.
app.use(helmet());

const origensPermitidas = (process.env.CORS_ORIGENS || 'http://localhost:5173').split(',');
app.use(cors({ origin: origensPermitidas, credentials: true }));

// Raw body para o webhook Stripe — precisa de estar antes do express.json().
app.use('/api/pagamentos/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '1mb' }));
app.use(limitadorGeral);

// Rota de saúde para load balancers e monitorização.
app.get('/saude', (req, res) => res.json({ estado: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/utilizadores', utilizadoresRouter);
app.use('/api/conta', tenantsRouter);
app.use('/api/contas', contasRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/transacoes', transacoesRouter);
app.use('/api/transferencias', transferenciasRouter);
app.use('/api/metas', metasRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/ia', iaRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/assinatura', assinaturasRouter);
app.use('/api/pagamentos', pagamentosRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/admin', adminRouter);

// Handler de erros sempre no final — depois de todas as rotas.
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(tratamentoErros);

export default app;
