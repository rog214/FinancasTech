import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transacao, TipoTransacao } from '../../models/transacao.model';
import { TransacaoService } from '../../services/transacao.service';
import { TemaService } from '../../services/tema.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  TipoTransacao = TipoTransacao; // Expondo para o template usá-lo

  receitas: Transacao[] = [];
  gastos: Transacao[] = [];
  totais = { receitas: 0, gastos: 0, saldo: 0 };
  
  abaAtiva: 'receitas' | 'gastos' = 'gastos';
  mostrarFormulario: boolean = true;
  
  // Paginação
  paginaAtual: number = 1;
  itensPorPagina: number = 12;

  itemEditandoId: string | null = null;
  idParaExcluir: string | null = null;

  isEditModalOpen = false;
  isDeleteModalOpen = false;

  novoItem: Partial<Transacao> = {
    tipo: TipoTransacao.RECEITA,
    estaPago: false
  };

  itemEditando: Partial<Transacao> = {};

  constructor(
    private transacaoService: TransacaoService,
    public temaService: TemaService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  mudarAba(aba: 'receitas' | 'gastos'): void {
    this.abaAtiva = aba;
    this.paginaAtual = 1; // Reseta paginação ao trocar aba
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  carregarDados(): void {
    const todas = this.transacaoService.obterTransacoes();
    this.receitas = todas.filter(t => t.tipo === TipoTransacao.RECEITA);
    this.gastos = todas.filter(t => t.tipo === TipoTransacao.GASTO);
    this.totais = this.transacaoService.calcularTotais();
  }

  // Getters Inteligentes de Paginação
  get transacoesAtivas(): Transacao[] {
    return this.abaAtiva === 'receitas' ? this.receitas : this.gastos;
  }

  get totalPaginas(): number {
    return Math.ceil(this.transacoesAtivas.length / this.itensPorPagina) || 1;
  }

  get itensPaginados(): Transacao[] {
    const startIndex = (this.paginaAtual - 1) * this.itensPorPagina;
    const endIndex = startIndex + this.itensPorPagina;
    return this.transacoesAtivas.slice(startIndex, endIndex);
  }

  mudarPagina(novaPag: number): void {
    if (novaPag >= 1 && novaPag <= this.totalPaginas) {
      this.paginaAtual = novaPag;
    }
  }

  aoEnviar(): void {
    // Criação via Formulário Principal
    const transacaoNova: Transacao = {
      id: crypto.randomUUID(),
      titulo: this.novoItem.titulo!,
      valor: this.novoItem.valor!,
      tipo: this.novoItem.tipo as TipoTransacao,
      observacao: this.novoItem.observacao || '',
      dataVencimento: this.formatarComAno(this.novoItem.dataVencimento!),
      estaPago: this.novoItem.estaPago!
    };
    this.transacaoService.adicionarTransacao(transacaoNova);
    this.novoItem = { tipo: TipoTransacao.RECEITA, estaPago: false };
    
    this.carregarDados();
  }

  aoEnviarEdicao(): void {
    if (this.itemEditandoId) {
      const transacaoAtualizada: Transacao = {
        id: this.itemEditandoId,
        titulo: this.itemEditando.titulo!,
        valor: this.itemEditando.valor!,
        tipo: this.itemEditando.tipo as TipoTransacao,
        observacao: this.itemEditando.observacao || '',
        dataVencimento: this.formatarComAno(this.itemEditando.dataVencimento!),
        estaPago: this.itemEditando.estaPago!
      };
      this.transacaoService.atualizarTransacao(transacaoAtualizada);
      this.fecharModais();
      this.carregarDados();
    }
  }

  editarTransacao(transacao: Transacao): void {
    this.itemEditandoId = transacao.id;
    
    // Converte de YYYY-MM-DD para MM/DD para preencher o input type="text"
    const partes = transacao.dataVencimento.split('-');
    let dataCurta = transacao.dataVencimento;
    if(partes.length === 3) {
      dataCurta = `${partes[2]}/${partes[1]}`;
    }

    this.itemEditando = { ...transacao, dataVencimento: dataCurta };
    this.isEditModalOpen = true;
  }

  // Preenche um Ano fake para que o HTML consiga usar o Angular DatePipe
  private formatarComAno(dataAberta: string): string {
    if(dataAberta.includes('/')) {
        const [dia, mes] = dataAberta.split('/');
        // Format ISO required for pipes and sorting: YYYY-MM-DD
        const anoAtual = new Date().getFullYear();
        return `${anoAtual}-${mes}-${dia}`;
    }
    return dataAberta;
  }

  formatarEntradaData(evento: any, contexto: 'novo' | 'editando'): void {
    let valor = evento.target.value;
    valor = valor.replace(/\D/g, ""); // Remove tudo o que não é dígito

    if (valor.length >= 1) {
      if (parseInt(valor[0]) > 3) valor = '0' + valor[0];
    }
    
    if (valor.length >= 2) {
      let dia = parseInt(valor.substring(0, 2));
      if (dia > 31) dia = 31;
      if (dia === 0) dia = 1;
      valor = dia.toString().padStart(2, '0') + valor.substring(2);
    }
    
    if (valor.length >= 3) {
      if (parseInt(valor[2]) > 1) {
         valor = valor.substring(0, 2) + '0' + valor.substring(2);
      }
    }

    if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{1,2})/, "$1/$2");
    }

    if (valor.length >= 5) {
      let partes = valor.split('/');
      let dia = parseInt(partes[0]);
      let mes = parseInt(partes[1]);

      if (mes > 12) mes = 12;
      if (mes === 0) mes = 1;

      const diasPorMes = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (dia > diasPorMes[mes - 1]) {
        dia = diasPorMes[mes - 1]; // Ajusta o dia para o final do mes correto
      }
      valor = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}`;
    }

    evento.target.value = valor;
    
    if(contexto === 'novo') this.novoItem.dataVencimento = valor;
    if(contexto === 'editando') this.itemEditando.dataVencimento = valor;
  }

  aoPerderFocoData(evento: any, contexto: 'novo' | 'editando'): void {
    let valor = evento.target.value;
    // Se o usuário digitou apenas 1 ou 2 números (ex: "5" ou "12")
    if (valor.length > 0 && valor.length <= 2 && !valor.includes('/')) {
      let dia = parseInt(valor);
      if (dia > 31) dia = 31;
      if (dia === 0) dia = 1;

      const mesAtual = (new Date().getMonth() + 1).toString().padStart(2, '0');
      valor = `${dia.toString().padStart(2, '0')}/${mesAtual}`;
      
      evento.target.value = valor;
      if(contexto === 'novo') this.novoItem.dataVencimento = valor;
      if(contexto === 'editando') this.itemEditando.dataVencimento = valor;
    }
  }

  fecharModais(): void {
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.itemEditandoId = null;
    this.idParaExcluir = null;
    this.itemEditando = {};
  }

  abrirModalExclusao(id: string): void {
    this.idParaExcluir = id;
    this.isDeleteModalOpen = true;
  }

  confirmarExclusao(): void {
    if (this.idParaExcluir) {
      this.transacaoService.removerTransacao(this.idParaExcluir);
      this.carregarDados();
      this.fecharModais();
    }
  }

  alternarPagamento(transacao: Transacao): void {
    this.transacaoService.alternarStatusPagamento(transacao);
    this.carregarDados();
  }
}
