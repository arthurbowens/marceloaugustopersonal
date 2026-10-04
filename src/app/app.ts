import { Component, computed, effect, ElementRef, signal, viewChild } from '@angular/core';

type ChatRole = 'bot' | 'user';

interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
}

interface QuickOption {
  label: string;
  value: string;
}

type ChatStep = 'objetivo' | 'local' | 'plano' | 'done';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** Substitua pelo seu número internacional, sem + ou espaços (ex.: 5511999999999). */
  readonly whatsappPhone = '557191186831';

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

  readonly chatOpen = signal(false);
  readonly chatTyping = signal(false);
  readonly chatStep = signal<ChatStep>('objetivo');
  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly chatAnswers = signal({
    objetivo: '',
    local: '',
    plano: '',
  });
  readonly freeText = signal('');

  private nextMessageId = 1;
  private chatBooted = false;

  readonly messagesEl = viewChild<ElementRef<HTMLElement>>('chatScroll');

  readonly objetivoOptions: QuickOption[] = [
    { label: 'Emagrecimento', value: 'Emagrecimento' },
    { label: 'Hipertrofia', value: 'Hipertrofia' },
    { label: 'Definição', value: 'Definição' },
    { label: 'Performance', value: 'Performance' },
  ];

  readonly localOptions: QuickOption[] = [
    { label: 'Academia', value: 'Academia' },
    { label: 'Em casa', value: 'Em casa' },
    { label: 'Os dois', value: 'Academia e em casa' },
  ];

  readonly planoOptions: QuickOption[] = [
    { label: 'Sim, tenho os dois', value: 'Sim — plano alimentar e de treino' },
    { label: 'Só treino', value: 'Só treino' },
    { label: 'Só alimentação', value: 'Só alimentação' },
    { label: 'Ainda não', value: 'Ainda não sigo nenhum plano' },
  ];

  readonly currentOptions = computed(() => {
    switch (this.chatStep()) {
      case 'objetivo':
        return this.objetivoOptions;
      case 'local':
        return this.localOptions;
      case 'plano':
        return this.planoOptions;
      default:
        return [];
    }
  });

  readonly showFreeText = computed(() => this.chatStep() === 'plano');

  readonly qualifiedWhatsappUrl = computed(() => {
    const a = this.chatAnswers();
    const text =
      `Olá, Marcelo! Falei com o assistente do site e quero iniciar a consultoria.\n\n` +
      `1️⃣ Objetivo: ${a.objetivo || '—'}\n` +
      `2️⃣ Treino: ${a.local || '—'}\n` +
      `3️⃣ Plano atual: ${a.plano || '—'}\n\n` +
      `Pode me explicar os próximos passos?`;
    return `https://wa.me/${this.whatsappPhone}?text=${encodeURIComponent(text)}`;
  });

  constructor() {
    effect(() => {
      this.chatMessages();
      this.chatTyping();
      queueMicrotask(() => this.scrollChatToBottom());
    });
  }

  toggleChat(): void {
    const opening = !this.chatOpen();
    this.chatOpen.set(opening);
    if (opening && !this.chatBooted) {
      this.chatBooted = true;
      void this.bootChat();
    }
  }

  closeChat(): void {
    this.chatOpen.set(false);
  }

  async selectOption(option: QuickOption): Promise<void> {
    if (this.chatTyping()) return;
    const step = this.chatStep();
    this.pushUser(option.label);

    if (step === 'objetivo') {
      this.chatAnswers.update((a) => ({ ...a, objetivo: option.value }));
      await this.askLocal();
    } else if (step === 'local') {
      this.chatAnswers.update((a) => ({ ...a, local: option.value }));
      await this.askPlano();
    } else if (step === 'plano') {
      this.chatAnswers.update((a) => ({ ...a, plano: option.value }));
      await this.finishChat();
    }
  }

  onFreeTextInput(event: Event): void {
    this.freeText.set((event.target as HTMLInputElement).value);
  }

  async submitFreeText(): Promise<void> {
    if (this.chatTyping() || this.chatStep() !== 'plano') return;
    const text = this.freeText().trim();
    if (!text) return;
    this.freeText.set('');
    this.pushUser(text);
    this.chatAnswers.update((a) => ({ ...a, plano: text }));
    await this.finishChat();
  }

  restartChat(): void {
    this.chatMessages.set([]);
    this.chatAnswers.set({ objetivo: '', local: '', plano: '' });
    this.chatStep.set('objetivo');
    this.freeText.set('');
    this.chatBooted = true;
    void this.bootChat();
  }

  private async bootChat(): Promise<void> {
    this.chatStep.set('objetivo');
    await this.botSay(
      'Oi! 👋 Sou o assistente do Marcelo Augusto.\n\n' +
        'Para te direcionar da melhor forma para a consultoria ideal, me conta rapidinho:',
    );
    await this.botSay(
      '1️⃣ Qual é o seu principal objetivo no momento?\n\n' +
        '• Emagrecimento\n• Hipertrofia\n• Definição\n• Performance',
    );
  }

  private async askLocal(): Promise<void> {
    this.chatStep.set('local');
    await this.botSay('Perfeito! 💪\n\n2️⃣ Você treina em academia ou em casa?');
  }

  private async askPlano(): Promise<void> {
    this.chatStep.set('plano');
    await this.botSay(
      'Show! Última pergunta:\n\n' +
        '3️⃣ Já segue algum plano alimentar ou de treinamento atualmente?\n\n' +
        'Pode escolher uma opção ou escrever com suas palavras.',
    );
  }

  private async finishChat(): Promise<void> {
    this.chatStep.set('done');
    const a = this.chatAnswers();
    await this.botSay(
      `Anotei aqui:\n\n` +
        `🎯 Objetivo: ${a.objetivo}\n` +
        `🏋️ Treino: ${a.local}\n` +
        `📋 Plano atual: ${a.plano}`,
    );
    await this.botSay(
      'Assim conseguimos entender melhor seu momento e te explicar como funciona a consultoria do Marcelo e quais são os próximos passos para iniciar sua evolução. 🚀\n\n' +
        'Na consultoria você recebe diagnóstico, plano personalizado e acompanhamento próximo — online ou presencial.\n\n' +
        'Toque abaixo para continuar no WhatsApp com o Marcelo. Suas respostas já vão na mensagem.',
    );
  }

  private async botSay(text: string): Promise<void> {
    this.chatTyping.set(true);
    await this.wait(700 + Math.min(text.length * 8, 900));
    this.chatTyping.set(false);
    this.pushBot(text);
  }

  private pushBot(text: string): void {
    this.chatMessages.update((msgs) => [
      ...msgs,
      { id: this.nextMessageId++, role: 'bot', text },
    ]);
  }

  private pushUser(text: string): void {
    this.chatMessages.update((msgs) => [
      ...msgs,
      { id: this.nextMessageId++, role: 'user', text },
    ]);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private scrollChatToBottom(): void {
    const el = this.messagesEl()?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}
