import request from 'supertest';
import app from '../../src/app.js';

async function loginComCredenciais({ email, senha }) {
  return request(app).post('/api/auth/login').send({ email, senha });
}

export async function loginAsAdmin(credenciaisAdmin) {
  const resposta = await loginComCredenciais(credenciaisAdmin);

  if (resposta.status !== 200 || resposta.body?.usuario?.role !== 'admin') {
    throw new Error(`Falha ao autenticar admin. Status: ${resposta.status}`);
  }

  return resposta.body.token;
}

export async function loginAsUser(credenciaisUsuario) {
  const resposta = await loginComCredenciais(credenciaisUsuario);

  if (resposta.status !== 200 || resposta.body?.usuario?.role !== 'aluno') {
    throw new Error(`Falha ao autenticar aluno. Status: ${resposta.status}`);
  }

  return resposta.body.token;
}

export default { loginAsAdmin, loginAsUser };
