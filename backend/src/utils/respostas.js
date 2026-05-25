// Formato de resposta consistente em toda a API.
// Todos os endpoints usam estas funções — nunca res.json() directamente.

export const sucesso = (res, dados, mensagem = 'Operação realizada com sucesso.', codigo = 200) =>
  res.status(codigo).json({ sucesso: true, mensagem, dados });

export const erro = (res, mensagem = 'Ocorreu um erro interno. A equipa foi notificada.', codigo = 500, detalhes = null) =>
  res.status(codigo).json({ sucesso: false, mensagem, ...(detalhes && { detalhes }) });

export const paginado = (res, dados, { pagina, limite, total }) =>
  res.status(200).json({
    sucesso: true,
    dados,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
      temProxima: pagina * limite < total,
      temAnterior: pagina > 1,
    },
  });
