import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addHours } from 'date-fns';
import { db } from '../../config/baseDados.js';
import { redisSessoes } from '../../config/redis.js';
import { tenants, utilizadores, categorias } from '../../baseDados/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { emTransacao } from '../../utils/transacao.js';
import { ErroNegocio, ErroNaoEncontrado } from '../../utils/erros.js';
import {
  enviarConfirmacaoEmail,
  enviarBoasVindasTrial,
  enviarRecuperacaoPassword,
} from '../../utils/email.js';

const SALT_ROUNDS = 12;
const REFRESH_EXPIRACAO_DIAS = Number(process.env.REFRESH_TOKEN_EXPIRACAO_DIAS) || 7;

const CATEGORIAS_PADRAO = [
  { nome: 'Alimentação', tipo: 'despesa', cor: '#ef4444', icone: 'utensils' },
  { nome: 'Transportes', tipo: 'despesa', cor: '#f97316', icone: 'car' },
  { nome: 'Saúde', tipo: 'despesa', cor: '#ec4899', icone: 'heart-pulse' },
  { nome: 'Habitação', tipo: 'despesa', cor: '#8b5cf6', icone: 'home' },
  { nome: 'Lazer', tipo: 'despesa', cor: '#06b6d4', icone: 'gamepad-2' },
  { nome: 'Educação', tipo: 'despesa', cor: '#3b82f6', icone: 'book-open' },
  { nome: 'Vestuário', tipo: 'despesa', cor: '#f59e0b', icone: 'shirt' },
  { nome: 'Outros', tipo: 'despesa', cor: '#6b7280', icone: 'tag' },
  { nome: 'Salário', tipo: 'receita', cor: '#22c55e', icone: 'banknote' },
  { nome: 'Freelance', tipo: 'receita', cor: '#10b981', icone: 'laptop' },
  { nome: 'Investimentos', tipo: 'receita', cor: '#0ea5e9', icone: 'trending-up' },
  { nome: 'Outros', tipo: 'receita', cor: '#84cc16', icone: 'plus-circle' },
];

export async function registar({ nome, email, password }) {
  const [existente] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.email, email))
    .limit(1);

  if (existente) throw new ErroNegocio('Já existe uma conta com este email.', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const tokenConfirmacao = uuidv4();
  const agora = new Date();

  await emTransacao(async (tx) => {
    const tenantId = uuidv4();
    const utilizadorId = uuidv4();

    await tx.insert(tenants).values({
      id: tenantId,
      nome,
      email,
      trialInicio: agora,
      trialFim: addDays(agora, 14),
      tokenConfirmacaoEmail: tokenConfirmacao,
      emailConfirmado: false,
      estado: 'trial',
    });

    await tx.insert(utilizadores).values({
      id: utilizadorId,
      tenantId,
      nome,
      email,
      passwordHash,
      papel: 'proprietario',
    });

    // Categorias padrão criadas automaticamente para não deixar a conta vazia.
    const categoriasPadrao = CATEGORIAS_PADRAO.map((c) => ({
      id: uuidv4(),
      tenantId,
      ...c,
      padrao: true,
    }));
    await tx.insert(categorias).values(categoriasPadrao);
  });

  const linkActivacao = `${process.env.FRONTEND_URL}/confirmar-email?token=${tokenConfirmacao}`;
  await enviarConfirmacaoEmail(email, nome, linkActivacao);
}

export async function login({ email, password }) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.email, email))
    .limit(1);

  if (!tenant) throw new ErroNegocio('Credenciais inválidas.', 401);
  if (!tenant.emailConfirmado) throw new ErroNegocio('Confirme o seu email antes de iniciar sessão.', 403);

  const [utilizador] = await db
    .select()
    .from(utilizadores)
    .where(and(eq(utilizadores.tenantId, tenant.id), eq(utilizadores.email, email)))
    .limit(1);

  if (!utilizador || !utilizador.activo) throw new ErroNegocio('Credenciais inválidas.', 401);

  const passwordValida = await bcrypt.compare(password, utilizador.passwordHash);
  if (!passwordValida) throw new ErroNegocio('Credenciais inválidas.', 401);

  const accessToken = emitirJWT(utilizador, tenant.id);
  const refreshToken = await criarRefreshToken(utilizador.id, tenant.id, utilizador.papel);

  return { accessToken, refreshToken, utilizador: { id: utilizador.id, nome: utilizador.nome, papel: utilizador.papel, tenantId: tenant.id } };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  const chave = `refresh:${refreshToken}`;
  await redisSessoes.del(chave);
}

export async function renovarToken(refreshToken) {
  if (!refreshToken) throw new ErroNegocio('Refresh token em falta.', 401);

  const chave = `refresh:${refreshToken}`;
  const dados = await redisSessoes.get(chave);
  if (!dados) throw new ErroNegocio('Sessão expirada. Inicie sessão novamente.', 401);

  const { utilizadorId, tenantId, papel } = JSON.parse(dados);

  const [utilizador] = await db
    .select({ id: utilizadores.id, nome: utilizadores.nome, activo: utilizadores.activo })
    .from(utilizadores)
    .where(eq(utilizadores.id, utilizadorId))
    .limit(1);

  if (!utilizador || !utilizador.activo) throw new ErroNegocio('Utilizador inactivo.', 401);

  const novoAccessToken = emitirJWT({ id: utilizadorId, papel }, tenantId);
  return { accessToken: novoAccessToken };
}

export async function confirmarEmail(token) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.tokenConfirmacaoEmail, token))
    .limit(1);

  if (!tenant) throw new ErroNegocio('Token de confirmação inválido ou já utilizado.', 400);

  await db.update(tenants)
    .set({ emailConfirmado: true, tokenConfirmacaoEmail: null })
    .where(eq(tenants.id, tenant.id));

  await enviarBoasVindasTrial(tenant.email, tenant.nome);
}

export async function recuperarPassword(email) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.email, email)).limit(1);
  // Não revelar se o email existe ou não — resposta idêntica em ambos os casos.
  if (!tenant) return;

  const token = uuidv4();
  const expira = addHours(new Date(), 1);

  await db.update(tenants)
    .set({ tokenRecuperacaoPassword: token, tokenRecuperacaoExpira: expira })
    .where(eq(tenants.id, tenant.id));

  const link = `${process.env.FRONTEND_URL}/redefinir-password?token=${token}`;
  await enviarRecuperacaoPassword(email, tenant.nome, link);
}

export async function redefinirPassword(token, novaPassword) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.tokenRecuperacaoPassword, token))
    .limit(1);

  if (!tenant) throw new ErroNegocio('Token inválido ou expirado.', 400);
  if (tenant.tokenRecuperacaoExpira < new Date()) {
    throw new ErroNegocio('O link de recuperação expirou. Solicite um novo.', 400);
  }

  const passwordHash = await bcrypt.hash(novaPassword, SALT_ROUNDS);

  await emTransacao(async (tx) => {
    await tx.update(utilizadores)
      .set({ passwordHash })
      .where(eq(utilizadores.tenantId, tenant.id));

    await tx.update(tenants)
      .set({ tokenRecuperacaoPassword: null, tokenRecuperacaoExpira: null })
      .where(eq(tenants.id, tenant.id));
  });
}

function emitirJWT(utilizador, tenantId) {
  return jwt.sign(
    { sub: utilizador.id, tenantId, papel: utilizador.papel },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRACAO || '15m' }
  );
}

async function criarRefreshToken(utilizadorId, tenantId, papel) {
  const token = uuidv4();
  const chave = `refresh:${token}`;
  const expiracao = REFRESH_EXPIRACAO_DIAS * 24 * 60 * 60;
  await redisSessoes.set(chave, JSON.stringify({ utilizadorId, tenantId, papel }), 'EX', expiracao);
  return token;
}
