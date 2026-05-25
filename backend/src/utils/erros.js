// Classes de erro com semântica clara para o handler global mapear para HTTP correcto.
// Lançar a classe certa evita if/else no tratamentoErros.js.

export class ErroNegocio extends Error {
  constructor(mensagem, codigo = 400) {
    super(mensagem);
    this.name = 'ErroNegocio';
    this.codigo = codigo;
  }
}

export class ErroNaoEncontrado extends Error {
  constructor(recurso = 'Recurso') {
    super(`${recurso} não encontrado.`);
    this.name = 'ErroNaoEncontrado';
    this.codigo = 404;
  }
}

// ErroIntegracao guarda o erro original para log detalhado sem o expor ao utilizador.
export class ErroIntegracao extends Error {
  constructor(servico, mensagem, erroOriginal = null) {
    super(mensagem);
    this.name = 'ErroIntegracao';
    this.servico = servico;
    this.erroOriginal = erroOriginal;
    this.codigo = 502;
  }
}

// ErroValidacao carrega os campos inválidos para resposta estruturada ao cliente.
export class ErroValidacao extends Error {
  constructor(campos) {
    super('Os dados enviados são inválidos.');
    this.name = 'ErroValidacao';
    this.campos = campos;
    this.codigo = 422;
  }
}
