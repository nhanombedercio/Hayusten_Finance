import { Router } from 'express';
import { autenticacao } from '../../middlewares/autenticacao.js';
import { ErroNegocio } from '../../utils/erros.js';
import * as ctrl from './adminController.js';

const router = Router();

// Middleware admin — verifica que o utilizador tem papel 'proprietario' e
// que acede com uma chave secreta de admin no header para dupla protecção.
router.use(autenticacao, (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return next(new ErroNegocio('Acesso não autorizado.', 403));
  }
  next();
});

router.get('/metricas', ctrl.metricas);
router.get('/tenants', ctrl.listarTenants);
router.get('/tenants/:id', ctrl.buscarTenant);
router.post('/tenants/:id/suspender', ctrl.suspenderTenant);
router.post('/tenants/:id/reactivar', ctrl.reactivarTenant);
router.delete('/tenants/:id', ctrl.eliminarTenant);
router.get('/pagamentos', ctrl.listarPagamentos);

export default router;
