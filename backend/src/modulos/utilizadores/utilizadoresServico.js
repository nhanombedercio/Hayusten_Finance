import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/baseDados.js';
import { utilizadores } from '../../baseDados/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { ErroNegocio, ErroNaoEncontrado } from '../../utils/erros.js';

const SALT_ROUNDS = 12;

const CAMPOS_PUBLICOS = {
  id: utilizadores.id,
  nome: utilizadores.nome,
  email: utilizadores.email,
  papel: utilizadores.papel,
  activo: utilizadores.activo,
  criadoEm: utilizadores.criadoEm,
};

export async function listar(tenantId) {
  return db.select(CAMPOS_PUBLICOS).from(utilizadores).where(eq(utilizadores.tenantId, tenantId));
}

export async function buscarPorId(tenantId, id) {
  const [utilizador] = await db
    .select(CAMPOS_PUBLICOS)
    .from(utilizadores)
    .where(and(eq(utilizadores.tenantId, tenantId), eq(utilizadores.id, id)))
    .limit(1);

  if (!utilizador) throw new ErroNaoEncontrado('Utilizador');
  return utilizador;
}

export async function criar(tenantId, dados) {
  const { nome, email, password, papel } = dados;

  const [existente] = await db
    .select({ id: utilizadores.id })
    .from(utilizadores)
    .where(and(eq(utilizadores.tenantId, tenantId), eq(utilizadores.email, email)))
    .limit(1);

  if (existente) throw new ErroNegocio('Já existe um utilizador com este email nesta conta.', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();

  await db.insert(utilizadores).values({ id, tenantId, nome, email, passwordHash, papel: papel || 'membro' });
  return buscarPorId(tenantId, id);
}

export async function editar(tenantId, id, dados) {
  await buscarPorId(tenantId, id);
  const { nome, papel, activo } = dados;
  await db.update(utilizadores)
    .set({ nome, papel, activo, actualizadoEm: new Date() })
    .where(and(eq(utilizadores.tenantId, tenantId), eq(utilizadores.id, id)));
  return buscarPorId(tenantId, id);
}

export async function eliminar(tenantId, id, utilizadorActualId) {
  const utilizador = await buscarPorId(tenantId, id);
  if (utilizador.papel === 'proprietario') throw new ErroNegocio('Não é possível eliminar o proprietário da conta.');
  if (id === utilizadorActualId) throw new ErroNegocio('Não pode eliminar a sua própria conta.');
  await db.update(utilizadores)
    .set({ activo: false, actualizadoEm: new Date() })
    .where(and(eq(utilizadores.tenantId, tenantId), eq(utilizadores.id, id)));
}

export async function actualizarPerfil(tenantId, utilizadorId, dados) {
  await buscarPorId(tenantId, utilizadorId);
  await db.update(utilizadores)
    .set({ nome: dados.nome, actualizadoEm: new Date() })
    .where(and(eq(utilizadores.tenantId, tenantId), eq(utilizadores.id, utilizadorId)));
  return buscarPorId(tenantId, utilizadorId);
}

export async function alterarPassword(tenantId, utilizadorId, { passwordActual, novaPassword }) {
  const [utilizador] = await db
    .select({ passwordHash: utilizadores.passwordHash })
    .from(utilizadores)
    .where(and(eq(utilizadores.tenantId, tenantId), eq(utilizadores.id, utilizadorId)))
    .limit(1);

  if (!utilizador) throw new ErroNaoEncontrado('Utilizador');

  const valida = await bcrypt.compare(passwordActual, utilizador.passwordHash);
  if (!valida) throw new ErroNegocio('Password actual incorrecta.', 401);

  const novoHash = await bcrypt.hash(novaPassword, SALT_ROUNDS);
  await db.update(utilizadores)
    .set({ passwordHash: novoHash, actualizadoEm: new Date() })
    .where(and(eq(utilizadores.tenantId, tenantId), eq(utilizadores.id, utilizadorId)));
}
