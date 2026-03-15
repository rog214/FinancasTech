import { Injectable } from '@angular/core';
import { Transacao, TipoTransacao } from '../models/transacao.model';

@Injectable({
  providedIn: 'root'
})
export class TransacaoService {
  private readonly CHAVE_ARMAZENAMENTO = 'banco_dados_transacoes_financeiras';

  constructor() {}

  obterTransacoes(): Transacao[] {
    const dados = localStorage.getItem(this.CHAVE_ARMAZENAMENTO);
    return dados ? JSON.parse(dados) : [];
  }

  adicionarTransacao(transacao: Transacao): void {
    const transacoes = this.obterTransacoes();
    transacoes.push(transacao);
    localStorage.setItem(this.CHAVE_ARMAZENAMENTO, JSON.stringify(transacoes));
  }

  removerTransacao(id: string): void {
    let transacoes = this.obterTransacoes();
    transacoes = transacoes.filter(t => t.id !== id);
    localStorage.setItem(this.CHAVE_ARMAZENAMENTO, JSON.stringify(transacoes));
  }

  atualizarTransacao(transacao: Transacao): void {
    const transacoes = this.obterTransacoes();
    const indice = transacoes.findIndex(t => t.id === transacao.id);
    if (indice !== -1) {
      transacoes[indice] = transacao;
      localStorage.setItem(this.CHAVE_ARMAZENAMENTO, JSON.stringify(transacoes));
    }
  }

  alternarStatusPagamento(transacao: Transacao): void {
    const transacaoAtualizada = { ...transacao, estaPago: !transacao.estaPago };
    this.atualizarTransacao(transacaoAtualizada);
  }

  calcularTotais(): { receitas: number; gastos: number; saldo: number } {
    const transacoes = this.obterTransacoes();
    const receitas = transacoes
      .filter(t => t.tipo === TipoTransacao.RECEITA)
      .reduce((acumulador, atual) => acumulador + atual.valor, 0);
    const gastos = transacoes
      .filter(t => t.tipo === TipoTransacao.GASTO)
      .reduce((acumulador, atual) => acumulador + atual.valor, 0);
    
    return {
      receitas,
      gastos,
      saldo: receitas - gastos
    };
  }
}
