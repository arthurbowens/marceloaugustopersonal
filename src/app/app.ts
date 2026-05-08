import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** Substitua pelo seu número internacional, sem + ou espaços (ex.: 5511999999999). */
  readonly whatsappPhone = '5511999999999';

  readonly whatsappUrl =
    'https://wa.me/' +
    this.whatsappPhone +
    '?text=' +
    encodeURIComponent(
      'Olá, Marcelo! Quero saber sobre consultoria.\n' +
        'Objetivo: \nTreino (dias/semana): \nOnline ou presencial: ',
    );

  /** Atualize com o e-mail real de contato. */
  readonly emailContactUrl =
    'mailto:contato@exemplo.com?subject=' +
    encodeURIComponent('Consultoria — Marcelo Augusto');

  readonly currentYear = new Date().getFullYear();
}
