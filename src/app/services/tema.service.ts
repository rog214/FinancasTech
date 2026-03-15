import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemaService {
  private modoEscuroAtivo = false;

  constructor() {
    this.carregarTemaSalvo();
  }

  estaNoModoEscuro(): boolean {
    return this.modoEscuroAtivo;
  }

  alternarTema(): void {
    this.modoEscuroAtivo = !this.modoEscuroAtivo;
    this.aplicarTema();
  }

  private carregarTemaSalvo(): void {
    const tema = localStorage.getItem('financas_app_tema');
    if (tema) {
      this.modoEscuroAtivo = tema === 'dark';
    } else {
      this.modoEscuroAtivo = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.aplicarTema();
  }

  private aplicarTema(): void {
    if (this.modoEscuroAtivo) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('financas_app_tema', this.modoEscuroAtivo ? 'dark' : 'light');
  }
}
