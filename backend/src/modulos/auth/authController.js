import * as authServico from './authServico.js';
import { sucesso } from '../../utils/respostas.js';

export async function registar(req, res, next) {
  try {
    await authServico.registar(req.body);
    sucesso(res, null, 'Conta criada. Verifique o seu email para activar a conta.', 201);
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const dados = await authServico.login(req.body);
    sucesso(res, dados, 'Sessão iniciada com sucesso.');
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    await authServico.logout(req.body.refreshToken);
    sucesso(res, null, 'Sessão terminada.');
  } catch (err) { next(err); }
}

export async function renovarToken(req, res, next) {
  try {
    const dados = await authServico.renovarToken(req.body.refreshToken);
    sucesso(res, dados, 'Token renovado.');
  } catch (err) { next(err); }
}

export async function confirmarEmail(req, res, next) {
  try {
    await authServico.confirmarEmail(req.body.token);
    sucesso(res, null, 'Email confirmado com sucesso. Já pode iniciar sessão.');
  } catch (err) { next(err); }
}

export async function recuperarPassword(req, res, next) {
  try {
    await authServico.recuperarPassword(req.body.email);
    sucesso(res, null, 'Se o email existe, receberá instruções em breve.');
  } catch (err) { next(err); }
}

export async function redefinirPassword(req, res, next) {
  try {
    await authServico.redefinirPassword(req.body.token, req.body.novaPassword);
    sucesso(res, null, 'Password redefinida com sucesso.');
  } catch (err) { next(err); }
}
