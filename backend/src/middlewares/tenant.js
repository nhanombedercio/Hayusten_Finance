// Popula req.tenant a partir do utilizador autenticado — nunca de body/query/params.
// Este middleware garante que o tenantId nunca pode ser injectado por um cliente malicioso.
// Deve ser colocado depois do middleware de autenticacao.
export function tenant(req, res, next) {
  req.tenant = { id: req.usuario.tenantId };
  next();
}
