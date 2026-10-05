import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import request from 'supertest';
import { expect } from 'chai';

import app from '../src/app.js';
import { loginAsAdmin, loginAsUser } from './helpers/auth.helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'data', 'fluxo-aluno-trabalho.data.json');
const testData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function gerarAlunoUnico(alunoBase, indiceCaso) {
  const sufixo = `${Date.now()}-${indiceCaso}`;
  const sufixoNumerico = `${Date.now()}${indiceCaso}`;
  const [localPart, domain] = alunoBase.email.split('@');

  return {
    ...alunoBase,
    nome: `${alunoBase.nome} ${sufixo}`,
    email: `${localPart}+${sufixo}@${domain}`,
    matricula: `${alunoBase.matricula}${sufixoNumerico}`,
  };
}

describe('Fluxo data-driven: admin cadastra aluno e aluno registra trabalho', () => {
  testData.casos.forEach((caso, indice) => {
    it(caso.nomeCaso, async () => {
      const adminToken = await loginAsAdmin(testData.admin);
      const novoAluno = gerarAlunoUnico(caso.novoAluno, indice);

      const criarAlunoResposta = await request(app)
        .post('/api/admin/alunos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoAluno);

      expect(criarAlunoResposta.status).to.equal(201);
      expect(criarAlunoResposta.body).to.include({
        nome: novoAluno.nome,
        email: novoAluno.email,
        matricula: novoAluno.matricula,
      });
      expect(criarAlunoResposta.body).to.have.property('id');

      const alunoId = criarAlunoResposta.body.id;

      const matriculaResposta = await request(app)
        .post(`/api/admin/disciplinas/${caso.matricula.disciplinaId}/matriculas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ alunoId });

      expect(matriculaResposta.status).to.equal(201);
      expect(matriculaResposta.body).to.include({
        alunoId,
        disciplinaId: caso.matricula.disciplinaId,
      });

      const alunoToken = await loginAsUser({
        email: novoAluno.email,
        senha: novoAluno.senha,
      });

      const registrarTrabalhoResposta = await request(app)
        .post(`/api/alunos/${alunoId}/trabalhos`)
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          ...caso.trabalho,
          disciplinaId: caso.matricula.disciplinaId,
        });

      expect(registrarTrabalhoResposta.status).to.equal(201);
      expect(registrarTrabalhoResposta.body).to.include({
        alunoId,
        disciplinaId: caso.matricula.disciplinaId,
        titulo: caso.trabalho.titulo,
        descricao: caso.trabalho.descricao,
      });
      expect(registrarTrabalhoResposta.body).to.have.property('status', 'entregue');
      expect(registrarTrabalhoResposta.body).to.have.property('id');
    });
  });
});
