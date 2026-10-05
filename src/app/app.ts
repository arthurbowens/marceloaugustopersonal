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

type ChatStep = 'objetivo' | 'dificuldade' | 'local' | 'done';

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
        'Objetivo: \nO que mais dificulta: ',
    );

  /** Atualize com o e-mail real de contato. */
  readonly emailContactUrl =
    'mailto:contato@exemplo.com?subject=' +
    encodeURIComponent('Consultoria Marcelo Augusto');

  readonly currentYear = new Date().getFullYear();

  readonly diadiaPhotos = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    src: `/diadia${n}.jpeg`,
    alt: `Dia a dia Team Marcelo Augusto, momento ${n}`,
  }));

  readonly resultadoSlides = [
    {
      kind: 'compare' as const,
      title: 'Evolução frontal',
      before: { src: '/antesfrente.jpeg', alt: 'Antes de frente' },
      after: { src: '/depoisfrente.jpeg', alt: 'Depois de frente' },
    },
    {
      kind: 'compare' as const,
      title: 'Evolução posterior',
      before: { src: '/antescostas.jpeg', alt: 'Antes de costas' },
      after: { src: '/depoiscostas.jpeg', alt: 'Depois de costas' },
    },
    {
      kind: 'single' as const,
      title: 'Resultado do aluno',
      src: '/resultado1.png',
      alt: 'Evolução de aluno 1',
    },
    {
      kind: 'single' as const,
      title: 'Resultado do aluno',
      src: '/resultado2.png',
      alt: 'Evolução de aluno 2',
    },
    {
      kind: 'single' as const,
      title: 'Resultado do aluno',
      src: '/resultado3.png',
      alt: 'Evolução de aluno 3',
    },
  ];

  readonly resultadoIndex = signal(0);
  readonly resultadosTrack = viewChild<ElementRef<HTMLElement>>('resultadosTrack');

  readonly chatOpen = signal(false);
  readonly chatTyping = signal(false);
  readonly chatStep = signal<ChatStep>('objetivo');
  readonly chatMessages = signal<ChatMessage[]>([]);
  readonly chatAnswers = signal({
    objetivo: '',
    dificuldade: '',
    local: '',
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

  readonly dificuldadeOptions: QuickOption[] = [
    { label: 'Sem planejamento específico', value: 'Treino sem um planejamento específico' },
    { label: 'Dificuldade para evoluir as cargas', value: 'Dificuldade para evoluir as cargas' },
    { label: 'Falta de constância', value: 'Falta de constância' },
    { label: 'Dúvida se o treino está adequado', value: 'Dúvida se o treino está adequado ao objetivo' },
  ];

  readonly localOptions: QuickOption[] = [
    { label: 'Treino em academia', value: 'Academia' },
    { label: 'Treino em casa', value: 'Em casa' },
    { label: 'Academia e em casa', value: 'Academia e em casa' },
  ];

  readonly currentOptions = computed(() => {
    switch (this.chatStep()) {
      case 'objetivo':
        return this.objetivoOptions;
      case 'dificuldade':
        return this.dificuldadeOptions;
      case 'local':
        return this.localOptions;
      default:
        return [];
    }
  });

  readonly showFreeText = computed(
    () => this.chatStep() === 'objetivo' || this.chatStep() === 'dificuldade',
  );

  readonly freeTextPlaceholder = computed(() =>
    this.chatStep() === 'objetivo'
      ? 'Ou um objetivo específico…'
      : 'Ou escreva com suas palavras…',
  );

  readonly qualifiedWhatsappUrl = computed(() => {
    const a = this.chatAnswers();
    const text =
      `Olá, Marcelo! Falei com a assistente do site e quero saber como funciona a consultoria.\n\n` +
      `1️⃣ Objetivo: ${a.objetivo || '-'}\n` +
      `2️⃣ O que mais dificulta: ${a.dificuldade || '-'}\n` +
      `3️⃣ Treino: ${a.local || '-'}\n\n` +
      `Pode me explicar as opções de acompanhamento?`;
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

  onResultadosScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const width = el.clientWidth;
    if (!width) return;
    const index = Math.round(el.scrollLeft / width);
    this.resultadoIndex.set(
      Math.max(0, Math.min(index, this.resultadoSlides.length - 1)),
    );
  }

  goToResultado(index: number): void {
    const track = this.resultadosTrack()?.nativeElement;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, this.resultadoSlides.length - 1));
    this.resultadoIndex.set(clamped);
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  }

  prevResultado(): void {
    this.goToResultado(this.resultadoIndex() - 1);
  }

  nextResultado(): void {
    this.goToResultado(this.resultadoIndex() + 1);
  }

  async selectOption(option: QuickOption): Promise<void> {
    if (this.chatTyping()) return;
    const step = this.chatStep();
    this.pushUser(option.label);

    if (step === 'objetivo') {
      this.chatAnswers.update((a) => ({ ...a, objetivo: option.value }));
      await this.askDificuldade();
    } else if (step === 'dificuldade') {
      this.chatAnswers.update((a) => ({ ...a, dificuldade: option.value }));
      await this.askLocal();
    } else if (step === 'local') {
      this.chatAnswers.update((a) => ({ ...a, local: option.value }));
      await this.finishChat();
    }
  }

  onFreeTextInput(event: Event): void {
    this.freeText.set((event.target as HTMLInputElement).value);
  }

  async submitFreeText(): Promise<void> {
    if (this.chatTyping()) return;
    const step = this.chatStep();
    if (step !== 'objetivo' && step !== 'dificuldade') return;
    const text = this.freeText().trim();
    if (!text) return;
    this.freeText.set('');
    this.pushUser(text);

    if (step === 'objetivo') {
      this.chatAnswers.update((a) => ({ ...a, objetivo: text }));
      await this.askDificuldade();
    } else {
      this.chatAnswers.update((a) => ({ ...a, dificuldade: text }));
      await this.askLocal();
    }
  }

  restartChat(): void {
    this.chatMessages.set([]);
    this.chatAnswers.set({ objetivo: '', dificuldade: '', local: '' });
    this.chatStep.set('objetivo');
    this.freeText.set('');
    this.chatBooted = true;
    void this.bootChat();
  }

  private async bootChat(): Promise<void> {
    this.chatStep.set('objetivo');
    await this.botSay(
      'Olá! Seja bem-vindo(a). 👋\n\n' +
        'Aqui é a assistente do Personal Trainer Marcelo Augusto.\n\n' +
        '1️⃣ Qual é o seu principal objetivo no momento?',
    );
  }

  private async askDificuldade(): Promise<void> {
    this.chatStep.set('dificuldade');
    this.freeText.set('');
    await this.botSay(
      'Perfeito! 👊\n\n' +
        '2️⃣ O que mais está dificultando chegar nesse resultado?\n\n' +
        'A consultoria monta estratégia para você e sua rotina, não só uma ficha genérica.',
    );
  }

  private async askLocal(): Promise<void> {
    this.chatStep.set('local');
    this.freeText.set('');
    await this.botSay('3️⃣ Você treina em academia ou em casa?');
  }

  private async finishChat(): Promise<void> {
    this.chatStep.set('done');
    await this.botSay(
      'Pelo que você me falou, o Marcelo consegue te ajudar bastante! 👊\n\n' +
        'Treino individualizado + acompanhamento com ajustes durante o processo.\n\n' +
        'Toque abaixo para ele te explicar a consultoria e as opções. 🔥',
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
