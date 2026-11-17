/**
 * Cenas “Enquanto isso” (PROPOSTAS — P-49).
 *
 * Enquanto o contato recebe a cliente em Midtown, os outros protagonistas
 * vivem o começo de suas próprias linhas (seção 20). Cada cena é curta,
 * jogável, termina num gancho e não explica o mistério.
 *
 * CANÔNICO usado aqui: o paciente do Bellevue com perda de sangue
 * incompatível, as duas perfurações perto do pescoço, a administração
 * tratando como causa indeterminada, o homem de terno escuro pedindo o
 * prontuário (que só depois desaparece); a fonte da funerária que pede
 * anonimato e a pressão editorial no Village Voice.
 */
import type { ClueDef, Dialogue, NpcBrief, NpcDef, Scene, SceneBrief } from '../../engine/narrative/types';

export const INTERLUDE_SCENES: Scene[] = [
  {
    id: 'interludio_bellevue',
    cast: 'daniel',
    image: 'loc_bellevue',
    title: 'Enquanto isso — Bellevue Hospital, pronto-socorro',
    location: 'loc_bellevue',
    caseId: 'caso_bellevue',
    npcs: ['enfermeira_ruth'],
    intro: [
      { text: 'Trigésima hora de plantão. O pronto-socorro do Bellevue tem o barulho de sempre: macas, um bêbado cantando no corredor, o telefone da triagem que não para.' },
      { text: 'Daniel Mercer está sentado diante de um formulário com um campo em branco. Causa da morte. Já preencheu centenas. Este, não consegue.' },
      { text: 'A enfermeira Ruth deixa um copo de café ao lado do papel e não diz nada. Ela também estava lá às quatro da manhã.' },
    ],
    onEnter: [{ type: 'case', id: 'caso_bellevue', status: 'ativo' }, { type: 'meet', npc: 'enfermeira_ruth' }],
    interactions: [
      {
        id: 'anotacoes', label: 'Reler as anotações da madrugada', kind: 'examinar', once: true, timeCost: 10,
        text: [
          { text: 'A letra é dele, mas parece de outra pessoa. Chegada às 3h40, sem documentos, trazido por ninguém — deixado na rampa das ambulâncias. Pálido como papel. Pressão inaudível.' },
          { text: 'Quatro bolsas de sangue. A quinta já estava pendurada quando o monitor desistiu, às 4h12.' },
          { text: 'Na margem, sublinhado duas vezes: nenhum ferimento compatível.' },
        ],
        effects: [{ type: 'clue', id: 'paciente_exangue' }],
      },
      {
        id: 'chefia', label: 'Falar com a chefia sobre o atestado', kind: 'dialogo', once: true,
        if: { used: 'interludio_bellevue:anotacoes' },
        effects: [{ type: 'dialogue', id: 'chefia_bellevue' }],
      },
      {
        id: 'necroterio', label: 'Descer ao necrotério', kind: 'investigar', once: true, timeCost: 20,
        text: [
          { text: 'O elevador de serviço desce devagar. Lá embaixo o frio é outro, mais limpo. A gaveta tem uma etiqueta escrita à mão: “DESCONHECIDO — 01/12 — A”.' },
          { text: 'Homem branco, trinta e poucos anos, mãos de quem nunca carregou peso. A pele tem a cor errada até para um morto.' },
        ],
        hint: 'Raciocínio. O que o corpo mostra depende de quanto se sabe ver.',
        test: { kind: 'd20', label: 'Medicina Legal', attribute: 'raciocinio', specialty: 'medicina_legal', altSpecialties: ['anatomia', 'medicina_emergencia'], tags: ['perceber_detalhes'] },
        effects: [{ type: 'clue', id: 'perfuracoes' }],
        outcomes: {
          critico: {
            text: [
              { text: 'Daniel afasta a gola de pele do pescoço. Duas marcas pequenas, a dois dedos uma da outra, sobre a jugular. Bordas limpas, sem hematoma, sem sinal de agulha de hospital.' },
              { text: 'E nenhuma lividez. O sangue não desceu para as costas depois da morte, porque não havia sangue para descer.' },
            ],
            effects: [{ type: 'clue', id: 'perfuracoes', extra: 'Sem lividez cadavérica: praticamente não restava sangue no corpo.' }, { type: 'sanity', event: 'horror_humano', who: 'actor' }],
          },
          sucesso: {
            text: [{ text: 'Daniel afasta a gola de pele do pescoço. Duas marcas pequenas, a dois dedos uma da outra, sobre a jugular. Bordas limpas, sem hematoma, sem sinal de agulha de hospital. Nada que ele saiba nomear.' }],
            effects: [{ type: 'clue', id: 'perfuracoes', extra: 'Bordas limpas, sem hematoma; não parecem marcas de agulha hospitalar.' }, { type: 'sanity', event: 'horror_humano', who: 'actor' }],
          },
          falha: { text: [{ text: 'Duas marcas pequenas perto do pescoço. Picadas? Acesso venoso mal feito de alguém na ambulância? O cansaço embaralha tudo. Daniel fecha a gaveta mais rápido do que gostaria.' }] },
        },
      },
      {
        id: 'balcao', label: 'Subir para a recepção', kind: 'acao', once: true, timeCost: 5,
        if: { any: [{ flag: 'atestado_assinado' }, { flag: 'necropsia_pedida' }] },
        image: 'npc_homem_terno',
        text: [
          { text: 'No balcão da recepção, um homem de terno escuro conversa com a atendente da noite. Não está molhado, apesar da garoa lá fora. Pede o prontuário do paciente desconhecido da madrugada.' },
          { text: 'A atendente diz que precisa de autorização da direção. Ele sorri como quem já esperava a resposta, agradece e vai embora sem pressa.' },
          { text: 'Antes de sair, olha uma vez para Daniel. Só uma vez.' },
        ],
        effects: [{ type: 'clue', id: 'homem_de_terno' }, { type: 'meet', npc: 'homem_terno' }, { type: 'flag', key: 'homem_terno_visto' }],
      },
      {
        id: 'seguir_homem', label: 'Ir atrás do homem de terno', kind: 'acao', once: true, timeCost: 10,
        if: { all: [{ flag: 'homem_terno_visto' }, { notFlag: 'bellevue_fim' }] },
        hint: 'Reflexo. Ele já está na porta.',
        test: { kind: 'd20', label: 'Vigilância', attribute: 'reflexo', specialty: 'vigilancia', altSpecialties: ['rastreamento', 'furtividade'], tags: ['movimentacao', 'passar_despercebido'] },
        outcomes: {
          sucesso: { text: [{ text: 'Na calçada da Primeira Avenida, um sedã escuro já espera com o motor ligado. O homem entra no banco de trás. Placa de Nova Jersey. O carro some no tráfego antes que Daniel leia o resto.' }], effects: [{ type: 'clue', id: 'homem_de_terno', extra: 'Saiu num sedã escuro com placa de Nova Jersey.' }] },
          falha: { text: [{ text: 'Quando Daniel chega à porta, a calçada da Primeira Avenida está cheia de gente e de guarda-chuvas. Nenhum terno escuro.' }] },
        },
      },
      {
        id: 'fim_plantao', label: 'Encerrar o plantão e ir para casa', kind: 'mover', timeCost: 10,
        if: { flag: 'homem_terno_visto' },
        text: [{ text: 'Daniel pendura o jaleco, veste o casaco e sai para a noite. No táxi, percebe que ainda está apertando a caneta com que não assinou — ou assinou — aquele papel.' }],
        effects: [{ type: 'flag', key: 'bellevue_fim' }, { type: 'endInterlude' }],
      },
    ],
  },
  {
    id: 'interludio_voice',
    cast: 'liz',
    image: 'loc_redacao',
    title: 'Enquanto isso — Redação do Village Voice, Cooper Square',
    location: 'loc_redacao',
    caseId: 'caso_voice',
    npcs: ['editor_voice'],
    intro: [
      { text: 'Noite de fechamento. A redação do Village Voice cheira a café queimado, papel e cigarro. Alguém discute ao telefone sobre um show cancelado no CBGB.' },
      { text: 'Liz Morgan relê pela terceira vez um parágrafo que não diz nada. A pauta da prefeitura está morta antes de nascer.' },
      { text: 'O telefone da mesa dela toca. Ninguém liga para essa linha depois das seis.' },
    ],
    onEnter: [{ type: 'case', id: 'caso_voice', status: 'ativo' }],
    interactions: [
      {
        id: 'atender', label: 'Atender o telefone', kind: 'dialogo', once: true,
        effects: [{ type: 'dialogue', id: 'fonte_funeraria' }],
      },
      {
        id: 'editor', label: 'Enfrentar o editor', kind: 'dialogo', once: true,
        if: { flag: 'fonte_desligou' },
        effects: [{ type: 'dialogue', id: 'editor_voice' }],
      },
      {
        id: 'sair_redacao', label: 'Pegar o casaco e sair', kind: 'mover', timeCost: 10,
        if: { flag: 'editor_conversou' },
        text: [{ text: 'Na rua, a garoa virou chuva. Liz para no orelhão da esquina, coloca a ficha, e desiste antes de discar. Ainda não sabe para quem contaria aquilo.' }],
        effects: [{ type: 'endInterlude' }],
      },
    ],
  },
  {
    id: 'escritorio_noite',
    image: 'cena_escritorio',
    phone: {},
    title: 'Midtown — o escritório, mais tarde',
    location: 'loc_escritorio',
    caseId: 'caso_reed',
    intro: [
      { text: 'De volta ao escritório da Rua 46. A cadeira onde a cliente se sentou ainda está virada para longe da janela, como ela a deixou.' },
      { text: 'O perfume dela ficou no ar. Não é um perfume que {contato} conheça.' },
      { text: 'Sobre a mesa, o telefone. Algumas pessoas talvez atendessem, mesmo a esta hora.', if: { flag: 'caso_aceito' } },
    ],
    interactions: [
      {
        id: 'ligar_victoria', image: 'obj_cartao', label: 'Telefonar para Victoria Whitmore e aceitar o caso', kind: 'dialogo', once: true,
        if: { all: [{ flag: 'caso_recusado' }, { notFlag: 'caso_aceito' }, { hasItem: 'cartao_victoria' }] },
        text: [
          { text: 'O número do cartão toca seis vezes. Quando ela atende, a voz não demonstra surpresa.' },
          { text: '— Eu sabia que ligaria. A chave estará com o porteiro, em um envelope com o seu nome. Não me faça arrepender disso.', speaker: 'Victoria Whitmore' },
        ],
        effects: [
          { type: 'flag', key: 'caso_aceito' },
          { type: 'decision', id: 'reconsiderou', label: 'Reconsiderou e aceitou o caso de Victoria Whitmore.' },
          { type: 'trust', npc: 'victoria', delta: 1 },
          { type: 'flag', key: 'chave_com_porteiro' },
          { type: 'objective', id: 'obj_decidir', status: 'concluido' },
          { type: 'objective', id: 'obj_encontrar_thomas', status: 'ativo' },
          { type: 'objective', id: 'obj_apartamento', status: 'ativo' },
        ],
      },
      {
        id: 'ir_apartamento', label: 'Ir ao prédio de Thomas Reed (Upper East Side)', kind: 'mover', timeCost: 40,
        if: { clue: 'endereco_thomas' },
        text: [{ text: 'Um táxi amarelo, um motorista que fala sozinho em grego, a Park Avenue iluminada como uma vitrine. Rua 78 Leste.' }],
        effects: [{ type: 'goto', scene: 'portaria' }],
      },
    ],
  },
];

export const INTERLUDE_DIALOGUES: Dialogue[] = [
  {
    id: 'chefia_bellevue',
    npc: 'chefe_plantao',
    start: 'inicio',
    nodes: {
      inicio: {
        text: [
          { text: 'O chefe do plantão nem levanta os olhos da prancheta.' },
          { text: '— Mercer. O desconhecido da madrugada. Causa indeterminada, assina e manda para o necrotério da cidade. A direção quer isso fechado hoje.', speaker: 'npc' },
        ],
        options: [
          {
            id: 'assinar', label: 'Assinar: causa indeterminada.', next: null,
            effects: [
              { type: 'flag', key: 'atestado_assinado' },
              { type: 'decision', id: 'atestado_assinado', label: 'Daniel assinou o atestado como causa indeterminada.' },
              { type: 'narrate', text: 'A caneta pesa mais do que deveria. Daniel assina. O chefe já está falando de outra coisa antes de a tinta secar.' },
            ],
          },
          {
            id: 'recusar', label: 'Não vou assinar sem uma necrópsia.', next: 'necropsia',
          },
        ],
      },
      necropsia: {
        text: [
          { text: 'Agora sim o chefe levanta os olhos.' },
          { text: '— Você quer abrir um corpo sem nome, sem família e sem seguro porque não gostou da cor da pele dele? — Uma pausa. — Faz o pedido. Não espere resposta rápida. E não espere que eu assine embaixo.', speaker: 'npc' },
        ],
        effects: [
          { type: 'flag', key: 'necropsia_pedida' },
          { type: 'decision', id: 'necropsia_pedida', label: 'Daniel recusou o atestado e pediu necrópsia.' },
          { type: 'trust', npc: 'chefe_plantao', delta: -1 },
          { type: 'track', track: 'investigacao_camarilla', delta: 1 },
        ],
        options: [{ id: 'fim', label: '(Voltar ao trabalho)', next: null }],
      },
    },
  },
  {
    id: 'fonte_funeraria',
    npc: 'fonte_funeraria',
    start: 'inicio',
    nodes: {
      inicio: {
        text: [
          { text: 'Do outro lado, respiração curta e barulho de rua. Um orelhão.' },
          { text: '— Morgan? A do Village Voice? — A voz é de homem, baixa, com sotaque do Queens. — Você não me conhece. E vai continuar sem conhecer, entendeu?', speaker: 'npc' },
        ],
        options: [
          { id: 'anonimato', label: 'Entendi. Ninguém vai saber de onde veio.', once: true, next: 'conta', effects: [{ type: 'trust', npc: 'fonte_funeraria', delta: 1 }] },
          { id: 'nome', label: 'Primeiro me diga com quem estou falando.', once: true, next: 'recua', effects: [{ type: 'trust', npc: 'fonte_funeraria', delta: -1 }] },
        ],
      },
      recua: {
        text: [{ text: '— Esquece. Isso foi um erro. — Silêncio. Ele não desliga. — Tá. Sem nome. Ou eu desligo agora.', speaker: 'npc' }],
        options: [{ id: 'aceita', label: 'Sem nome. Fale.', next: 'conta' }],
      },
      conta: {
        text: [
          { text: '— Eu trabalho numa funerária. Não importa qual. A gente recebe corpos que ninguém reclama. Isso é normal. — Ele baixa a voz. — O que não é normal é a papelada chegar pela metade. Sem nome, sem hospital de origem, às vezes sem causa.', speaker: 'npc' },
          { text: '— E não é só a gente. Converso com gente de outros lugares. Mesma coisa. Mesmo jeito.', speaker: 'npc' },
        ],
        effects: [{ type: 'clue', id: 'fonte_funeraria' }],
        options: [
          {
            id: 'detalhe', label: 'Mesmo jeito como?', once: true,
            test: { kind: 'd20', label: 'Entrevistas', attribute: 'presenca', specialty: 'entrevistas', altSpecialties: ['fontes_contatos', 'persuasao'], tags: ['persuasao', 'empatia'] },
            outcomes: {
              sucesso: { text: [{ text: '— Brancos. Brancos demais. A gente maquia morto há vinte anos, moça, e esses dão trabalho porque não têm cor nenhuma por baixo. — Ele para. — Eu não devia ter dito isso por telefone.', speaker: 'npc' }], effects: [{ type: 'clue', id: 'fonte_funeraria', extra: 'Os corpos chegam pálidos demais, “sem cor nenhuma por baixo”.' }] },
              falha: { text: [{ text: '— Já falei demais por telefone. — A voz endurece. — Se quiser saber, vai ter que ser pessoalmente.', speaker: 'npc' }] },
            },
          },
          { id: 'encontro', label: 'Podemos nos encontrar?', once: true, next: 'encontro' },
        ],
      },
      encontro: {
        text: [
          { text: '— Amanhã. Depois do expediente. Eu ligo e digo onde. — Um barulho do lado de lá, uma porta, alguém chamando. — Tenho que ir.', speaker: 'npc' },
          { text: 'Clique. Tom de discagem. Liz percebe que anotou tudo sem perceber que estava anotando.' },
        ],
        effects: [{ type: 'objective', id: 'obj_voice', status: 'ativo' }, { type: 'flag', key: 'fonte_desligou' }],
        options: [{ id: 'fim', label: '(Desligar)', next: null }],
      },
    },
  },
  {
    id: 'editor_voice',
    npc: 'editor_voice',
    start: 'inicio',
    nodes: {
      inicio: {
        text: [
          { text: 'O editor aparece na porta do cubículo com as mangas arregaçadas e a gravata no bolso.' },
          { text: '— Morgan. A pauta da prefeitura. Na minha mesa às onze. — Ele vê o bloco de notas cheio. — O que é isso?', speaker: 'npc' },
        ],
        effects: [{ type: 'flag', key: 'editor_conversou' }],
        options: [
          {
            id: 'defender', label: 'Uma história de verdade. Me dê dois dias.', once: true,
            test: { kind: 'd20', label: 'Persuasão', attribute: 'presenca', specialty: 'persuasao', altSpecialties: ['manipulacao', 'politica'], tags: ['persuasao', 'argumentacao'] },
            outcomes: {
              sucesso: { text: [{ text: '— Dois dias. — Ele aponta o dedo. — E a da prefeitura também. Não me faça parecer idiota na reunião de pauta.', speaker: 'npc' }], effects: [{ type: 'flag', key: 'voice_dois_dias' }, { type: 'decision', id: 'voice_prazo', label: 'Liz conseguiu dois dias do editor para a história dos corpos.' }], next: null },
              falha: { text: [{ text: '— Corpos sem nome em funerária? Isso é pauta do Post, Morgan, não nossa. — Ele já está indo embora. — Prefeitura. Onze horas.', speaker: 'npc' }], effects: [{ type: 'flag', key: 'voice_pressao' }, { type: 'decision', id: 'voice_pressao', label: 'O editor barrou a história dos corpos.' }], next: null },
            },
          },
          { id: 'esconder', label: 'Nada. Rascunho. A pauta sai às onze.', once: true, next: null, effects: [{ type: 'flag', key: 'voice_escondido' }, { type: 'decision', id: 'voice_escondido', label: 'Liz escondeu a história do editor.' }] },
        ],
      },
    },
  },
];

export const INTERLUDE_CLUES: ClueDef[] = [
  { id: 'paciente_exangue', image: 'loc_bellevue', caseId: 'caso_bellevue', importance: 'importante', title: 'O desconhecido da madrugada', description: 'Chegou às 3h40, deixado na rampa das ambulâncias, sem documentos. Recebeu quatro bolsas de sangue e morreu às 4h12. Nenhum ferimento compatível com a perda.', location: 'loc_bellevue', characters: ['daniel'], related: ['perfuracoes'] },
  { id: 'perfuracoes', image: 'loc_bellevue', caseId: 'caso_bellevue', importance: 'importante', title: 'Duas marcas no pescoço', description: 'Duas pequenas perfurações perto do pescoço do paciente desconhecido.', location: 'loc_bellevue', characters: ['daniel'], related: ['paciente_exangue', 'vestigios_sangue'] },
  { id: 'homem_de_terno', image: 'npc_homem_terno', caseId: 'caso_bellevue', importance: 'importante', title: 'O homem de terno escuro', description: 'Um homem de terno escuro pediu na recepção o prontuário do paciente desconhecido. Sem autorização, foi embora.', location: 'loc_bellevue', characters: ['homem_terno'], related: ['paciente_exangue'] },
  { id: 'fonte_funeraria', caseId: 'caso_voice', importance: 'importante', title: 'A voz do orelhão', description: 'Um funcionário de funerária, anônimo, diz que corpos chegam sem nome, sem hospital de origem e às vezes sem causa da morte — e que o mesmo acontece em outros lugares.', location: 'loc_redacao', characters: ['fonte_funeraria'], related: ['noticia_corpos'] },
];

export const INTERLUDE_NPCS: NpcDef[] = [
  { id: 'enfermeira_ruth', gender: 'f', name: 'Ruth', publicRole: 'Enfermeira do pronto-socorro do Bellevue.', location: 'Bellevue Hospital', initialTrust: 1, publicNotes: 'Estava de plantão na madrugada.' },
  { id: 'chefe_plantao', gender: 'm', name: 'O chefe do plantão', publicRole: 'Chefe do plantão do pronto-socorro do Bellevue.', location: 'Bellevue Hospital', initialTrust: 0, publicNotes: 'Quer o caso fechado.' },
  { id: 'editor_voice', gender: 'm', name: 'O editor', publicRole: 'Editor de Liz no Village Voice.', location: 'Village Voice', initialTrust: 0, publicNotes: 'Mangas arregaçadas, gravata no bolso, prazo sempre ontem.' },
];

export const INTERLUDE_SCENE_BRIEFS: Record<string, SceneBrief> = {
  interludio_bellevue: {
    ambiente: 'Pronto-socorro do Bellevue Hospital, Manhattan, noite de 1º de dezembro de 1992. Daniel Mercer está no fim de um plantão de trinta horas.',
    objetos: ['o formulário de atestado de óbito com o campo da causa em branco', 'um copo de café', 'macas, o telefone da triagem', 'o elevador de serviço para o necrotério', 'a recepção, com uma atendente da noite'],
  },
  interludio_voice: {
    ambiente: 'Redação do Village Voice em Cooper Square, noite de fechamento. Máquinas de escrever, café queimado, cigarro.',
    objetos: ['a mesa de Liz com um bloco de notas', 'o telefone da mesa', 'a pauta da prefeitura inacabada', 'o cubículo do editor'],
  },
  escritorio_noite: {
    ambiente: 'O escritório de Midtown depois da visita da cliente, à noite.',
    objetos: ['a cadeira que a cliente usou', 'o telefone', 'a mesa com as contas', 'a janela com o neon da rua'],
  },
};

export const INTERLUDE_NPC_BRIEFS: Record<string, NpcBrief> = {
  enfermeira_ruth: {
    persona: 'Enfermeira veterana do pronto-socorro, cinquenta e poucos anos, prática e calada.',
    estilo: 'Poucas palavras, ironia seca, protege os médicos jovens.',
    sabe: ['Estava no atendimento das 3h40 às 4h12.', 'O paciente foi deixado na rampa das ambulâncias; ninguém viu quem o deixou.', 'Nunca viu alguém receber tanto sangue e continuar perdendo.'],
    evita: ['especular sobre o que causou aquilo'],
    naoSabe: ['quem era o paciente', 'quem é o homem de terno'],
  },
  chefe_plantao: {
    persona: 'Chefe do plantão, cansado e político, quer números baixos e nenhum problema com a direção.',
    estilo: 'Impaciente, burocrático, corta a conversa.',
    sabe: ['A direção quer o caso fechado como causa indeterminada.'],
    evita: ['qualquer discussão médica sobre o caso'],
    naoSabe: ['quem pediu à direção que fechasse o caso'],
  },
  homem_terno: {
    persona: 'Homem de terno escuro, educado, calmo demais, que não se molha na chuva.',
    estilo: 'Cortês, frases curtas, nunca responde o que perguntam.',
    sabe: ['Diz ser de um departamento da prefeitura.'],
    evita: ['o próprio nome', 'para quem trabalha de verdade', 'por que quer o prontuário'],
    naoSabe: [],
  },
  fonte_funeraria: {
    persona: 'Funcionário de funerária do Queens, assustado, falando de um orelhão.',
    estilo: 'Sussurra, interrompe, tem pressa.',
    sabe: ['Corpos chegam sem nome, sem hospital de origem e às vezes sem causa da morte.', 'Colegas de outras funerárias contam o mesmo.'],
    evita: ['dizer o próprio nome ou a funerária onde trabalha', 'falar mais por telefone'],
    naoSabe: ['quem manda os corpos', 'por quê'],
  },
  editor_voice: {
    persona: 'Editor do Village Voice, veterano, cínico, afogado em prazos.',
    estilo: 'Rápido, irônico, aponta o dedo.',
    sabe: ['A pauta da prefeitura precisa sair às onze.'],
    evita: ['dar espaço para histórias sem prova'],
    naoSabe: ['nada sobre os corpos'],
  },
};
