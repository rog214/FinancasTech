export enum TipoTransacao {
  RECEITA = 'RECEITA',
  GASTO = 'GASTO'
}

export interface Transacao {
  id: string;
  titulo: string;
  valor: number;
  tipo: TipoTransacao;
  observacao: string;
  dataVencimento: string;
  estaPago: boolean;
}
