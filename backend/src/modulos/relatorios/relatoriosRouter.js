import { Router } from 'express';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { tenant } from '../../middlewares/tenant.js';
import * as ctrl from './relatoriosController.js';

const router = Router();
router.use(autenticacao, tenant);

router.get('/mensal', ctrl.mensal);
router.get('/exportar/pdf', ctrl.exportarPDF);
router.get('/exportar/excel', ctrl.exportarExcel);
router.post('/enviar-agora', ctrl.enviarAgora);

export default router;
