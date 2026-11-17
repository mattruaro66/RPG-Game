/**
 * Investigação: O desaparecimento de Thomas Reed (seção 20.3).
 *
 * CANÔNICO: Victoria Whitmore (aparência), Thomas Reed (38, consultor financeiro,
 * desaparecido há 11 dias, amante de Victoria), Richard Whitmore (influência e
 * contatos na polícia), dívida de Jack (US$ 300 mil), oferta de US$ 2 milhões
 * e o diálogo sobre a polícia (preservado integralmente).
 *
 * PROPOSTO (refinável): Sal Benedetto, o apartamento, as pistas materiais,
 * o Nocturne, a Halcyon Holdings, os invasores e a adaptação quando Jack
 * não está no grupo.
 */
import type { ClueDef, Dialogue, DocumentDef, EncounterDef, NpcDef, ObjectiveDef, Scene } from '../../engine/narrative/types';

// ---------------------------------------------------------------------------
// Cenas
// ---------------------------------------------------------------------------

export const REED_SCENES: Scene[] = [
  {
    id: 'escritorio',
    image: 'cena_escritorio',
    phone: { flag: 'victoria_saiu' },
    title: 'Midtown, Rua 46 Oeste — fim de tarde',
    location: 'loc_escritorio',
    caseId: 'caso_reed',
    intro: [
      { text: 'O escritório de Jack Sullivan ficava no quarto andar de um prédio cansado da Rua 46 Oeste, entre uma agência de empregos e um dentista que ninguém via sair. O aquecedor estalava como se estivesse pedindo desculpas.', if: { contactIs: 'jack' } },
      { text: 'Jack olhou para a pilha de envelopes sobre a mesa. Contas. Avisos. Um deles, com papel caro demais para ser de banco, ele preferiu não abrir.', if: { contactIs: 'jack' } },
      { text: 'O escritório de Jack Sullivan ficava no quarto andar de um prédio cansado da Rua 46 Oeste. Jack tinha sumido havia dois dias, deixando a chave com {contato_completo} e um bilhete de três linhas: “Segura as pontas. Credores não abrem a porta sozinhos. Volto quando der.”', if: { contactIsNot: 'jack' } },
      { text: 'Lá fora, a noite de dezembro já tinha engolido a cidade. Eram quase cinco da tarde, e {contato} estava sozinho com o barulho do aquecedor e uma hora marcada com uma cliente que não quis dizer o nome ao telefone.', if: { contactIs: 'jack' } },
      { text: 'Lá fora, a noite de dezembro já tinha engolido a cidade. Eram quase cinco da tarde. {contato} folheava a agenda de Jack: uma única anotação para hoje, às cinco e meia, sem nome. “Cliente nova. Pagar adiantado.”', if: { contactIsNot: 'jack' } },
    ],
    onEnter: [
      { type: 'case', id: 'caso_reed', status: 'ativo' },
      { type: 'objective', id: 'obj_ouvir_cliente', status: 'ativo' },
    ],
    interactions: [
      {
        id: 'jornal', image: 'obj_jornal', label: 'Examinar o jornal do dia', kind: 'examinar', once: true,
        text: [
          { text: 'O Daily News, dobrado na página doze: “CORPO SEM IDENTIFICAÇÃO ENCONTRADO NO PIER 40 — o terceiro em novembro, segundo funcionários do necrotério”. Três parágrafos. Nenhum nome. Nenhuma causa da morte.' },
          { text: 'Liz reconhece a história. É exatamente o tipo de coisa que alguém tem tentado lhe contar há semanas.', if: { hasCharacter: 'liz' } },
        ],
        effects: [{ type: 'clue', id: 'noticia_corpos' }],
      },
      {
        id: 'gaveta', image: 'obj_promissoria', label: 'Abrir a gaveta da escrivaninha', kind: 'examinar', once: true,
        text: [
          { text: 'Jack abriu a gaveta que evitava. Entre recibos de penhor, a nota promissória: trezentos mil dólares devidos a Richard Whitmore. A assinatura dele, firme demais para quem sabia que não poderia pagar.', if: { contactIs: 'jack' } },
          { text: 'Na gaveta de Jack, entre recibos de penhor, {contato} encontra uma nota promissória: trezentos mil dólares devidos a Richard Whitmore. Talvez isso explique o sumiço.', if: { contactIsNot: 'jack' } },
        ],
        effects: [{ type: 'clue', id: 'divida_richard' }],
      },
      {
        id: 'esperar_cliente', label: 'Aguardar', kind: 'esperar', once: true, timeCost: 50,
        if: { notFlag: 'victoria_chegou' },
        text: [{ text: 'Os minutos se arrastam. O aquecedor estala. Às 17h40, três batidas na porta — leves, espaçadas, de quem não tem pressa.' }],
        effects: [
          { type: 'flag', key: 'victoria_chegou' },
          { type: 'dialogue', id: 'victoria' },
        ],
      },
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
  {
    id: 'portaria',
    image: 'cena_portaria',
    phone: {},
    npcs: ['sal'],
    title: 'Rua 78 Leste, nº 211 — portaria',
    location: 'loc_predio_thomas',
    caseId: 'caso_reed',
    ambientTags: ['ambiente_com_estranhos'],
    intro: [
      { text: 'Um prédio de antes da guerra, tijolo escuro e toldo verde. No saguão, mármore gasto, um espelho com moldura dourada e um porteiro de uniforme assistindo aos Knicks numa televisão do tamanho de uma caixa de sapatos.' },
      { text: 'O crachá diz SAL. Ele levanta os olhos sem pressa.' },
    ],
    onEnter: [{ type: 'meet', npc: 'sal' }],
    interactions: [
      {
        id: 'falar_sal', label: 'Conversar com o porteiro', kind: 'dialogo',
        effects: [{ type: 'dialogue', id: 'sal' }],
      },
      {
        id: 'subir_chave', label: 'Mostrar a chave e subir', kind: 'mover', timeCost: 5,
        if: { all: [{ hasItem: 'chave_apartamento' }, { notFlag: 'entrou_apartamento' }] },
        text: [
          { text: 'Sal olha a chave, depois para o grupo. — A senhora Whitmore disse que alguém viria. — Uma pausa. — Não disse que seriam tantos. Quinto andar. O elevador range, mas funciona.' },
        ],
        effects: [
          { type: 'flag', key: 'registrados_portaria' },
          { type: 'flag', key: 'entrou_apartamento' },
          { type: 'goto', scene: 'apartamento' },
        ],
      },
      {
        id: 'pegar_envelope', label: 'Pedir o envelope deixado por Victoria', kind: 'dialogo', once: true, timeCost: 5,
        if: { all: [{ flag: 'chave_com_porteiro' }, { notItem: 'chave_apartamento' }] },
        text: [{ text: 'Sal entrega um envelope cor de vinho sem fazer perguntas. Dentro, uma chave Medeco e uma fotografia.' }],
        effects: [
          { type: 'item', itemId: 'chave_apartamento' },
          { type: 'item', itemId: 'foto_thomas' },
        ],
      },
      {
        id: 'passar_portaria', label: 'Passar pela portaria como quem mora ali', kind: 'acao', once: true, timeCost: 5,
        if: { notFlag: 'entrou_apartamento' },
        hint: 'Teste de Presença. Falhar desperta a desconfiança do porteiro.',
        test: { kind: 'd20', label: 'Infiltração', attribute: 'presenca', specialty: 'infiltracao', altSpecialties: ['disfarces', 'infiltracao_social'], tags: ['passar_despercebido', 'adaptacao_social'] },
        outcomes: {
          sucesso: {
            text: [{ text: 'Um aceno distraído, o passo de quem está atrasado para o jantar. Sal mal tira os olhos do jogo.' }],
            effects: [{ type: 'flag', key: 'entrada_furtiva' }, { type: 'flag', key: 'entrou_apartamento' }, { type: 'goto', scene: 'apartamento' }],
          },
          falha: {
            text: [{ text: '— Ei. Ei! Vocês não moram aqui. — Sal se levanta. — Quem vocês procuram?' }],
            effects: [{ type: 'trust', npc: 'sal', delta: -1 }, { type: 'flag', key: 'sal_desconfiado' }, { type: 'track', track: 'risco_protagonistas', delta: 1 }],
          },
        },
      },
      {
        id: 'escada_servico', label: 'Esperar a ronda do porteiro e subir pela escada de serviço', kind: 'mover', timeCost: 60,
        if: { notFlag: 'entrou_apartamento' },
        hint: 'Sem teste. Leva tempo e aumenta o risco.',
        text: [
          { text: 'Uma hora no frio, do outro lado da rua, até Sal sair para a ronda das oito. A porta de serviço do beco está escorada com um tijolo. Cinco lances de escada no escuro.' },
          { text: 'A fechadura do 5C é boa. Ray resolve em quarenta segundos.', if: { all: [{ hasCharacter: 'ray' }, { notItem: 'chave_apartamento' }] } },
          { text: 'Sem chave, a porta do 5C cede ao terceiro empurrão, com um estalo seco que ecoa pelo corredor.', if: { all: [{ notCharacter: 'ray' }, { notItem: 'chave_apartamento' }] } },
        ],
        effects: [
          { type: 'flag', key: 'entrada_furtiva' },
          { type: 'flag', key: 'entrou_apartamento' },
          { type: 'track', track: 'risco_protagonistas', delta: 1 },
          { type: 'goto', scene: 'apartamento' },
        ],
      },
      {
        id: 'voltar_apartamento', label: 'Subir de novo ao 5C', kind: 'mover', timeCost: 5,
        if: { all: [{ flag: 'entrou_apartamento' }, { notFlag: 'invasores_resolvidos' }] },
        effects: [{ type: 'goto', scene: 'apartamento' }],
      },
    ],
  },
  {
    id: 'apartamento',
    image: 'cena_apartamento',
    title: 'Apartamento 5C',
    location: 'loc_apartamento',
    caseId: 'caso_reed',
    dangerSense: 'alguém esteve aqui há pouco tempo — e talvez volte.',
    intro: [
      { text: 'O 5C cheira a frio e a água sanitária. O aquecimento está desligado há dias. A luz do poste entra pela janela e desenha a sala em cinza: sofá, estante, uma escrivaninha de mogno, um casaco pendurado ao lado da porta.' },
      { text: 'Alguém já esteve aqui. Não se deu ao trabalho de esconder isso.' },
    ],
    onEnter: [{ type: 'objective', id: 'obj_apartamento', status: 'ativo' }],
    interactions: [
      {
        id: 'sala', image: 'cena_apartamento', label: 'Examinar a sala', kind: 'examinar', once: true,
        text: [{ text: 'Gavetas no chão. Almofadas cortadas. Livros arrancados da estante e abertos, como se alguém procurasse algo entre as páginas. Mas a televisão continua no lugar, o aparelho de som também — e um Rolex de ouro repousa intocado sobre a mesa de centro.' }],
        effects: [{ type: 'clue', id: 'apartamento_revirado' }],
      },
      {
        id: 'sala_detalhe', label: 'Reconstruir o que aconteceu na sala', kind: 'investigar', once: true,
        if: { used: 'apartamento:sala' },
        hint: 'Raciocínio. Permite cooperação.',
        test: { kind: 'd20', label: 'Investigação de Campo', attribute: 'raciocinio', specialty: 'investigacao_de_campo', altSpecialties: ['criminologia', 'deducao'], tags: ['perceber_detalhes'], allowCooperation: true },
        outcomes: {
          critico: {
            text: [
              { text: 'Não foi assalto. Quem revirou isso procurava papéis — pastas, agendas, disquetes. Profissionais: cada gaveta foi recolocada no trilho antes de ser esvaziada, para não fazer barulho.' },
              { text: 'E não encontraram tudo. A escrivaninha tem um fundo dois centímetros mais raso do que deveria.' },
            ],
            effects: [{ type: 'clue', id: 'busca_profissional', extra: 'A escrivaninha parece ter um fundo falso.' }, { type: 'flag', key: 'fundo_falso_revelado' }],
          },
          sucesso: {
            text: [{ text: 'Não foi assalto. Quem revirou isso procurava papéis — pastas, agendas, disquetes. Profissionais: cada gaveta foi recolocada no trilho antes de ser esvaziada, para não fazer barulho.' }],
            effects: [{ type: 'clue', id: 'busca_profissional' }],
          },
          falha: { text: [{ text: 'Bagunça é bagunça. Difícil dizer mais do que isso.' }] },
          cooperacao: { text: [{ text: 'Trabalhando juntos, notam também que a busca começou pela escrivaninha e terminou nela: o resto foi frustração.' }], effects: [{ type: 'clue', id: 'busca_profissional', extra: 'A busca começou e terminou na escrivaninha.' }] },
        },
      },
      {
        id: 'escrivaninha', image: 'obj_agenda', label: 'Examinar a escrivaninha', kind: 'examinar', once: true,
        text: [{ text: 'Sob uma pilha de extratos rasgados, uma agenda de couro de 1992. Os compromissos de Thomas são meticulosos até 19 de novembro. Depois disso, várias páginas foram arrancadas com cuidado, rente à costura.' }],
        effects: [{ type: 'item', itemId: 'agenda_thomas' }, { type: 'clue', id: 'agenda_thomas' }],
      },
      {
        id: 'agenda_decalque', image: 'obj_agenda', label: 'Procurar marcas na página seguinte às arrancadas', kind: 'investigar', once: true,
        if: { clue: 'agenda_thomas' },
        hint: 'Raciocínio. Uma única tentativa: uma falha borra o papel.',
        test: { kind: 'd20', label: 'Perícia Documental', attribute: 'raciocinio', specialty: 'pericia_documental', altSpecialties: ['falsificacao', 'documentar'], tags: ['perceber_detalhes', 'execucao_cuidadosa'] },
        outcomes: {
          sucesso: {
            text: [{ text: 'Grafite passado de leve, em diagonal. As letras surgem fantasmagóricas: “20/11 — 23h — R.W. — Ludlow. Levar as cópias.”' }],
            effects: [{ type: 'clue', id: 'agenda_decalque' }, { type: 'document', id: 'doc_decalque' }],
          },
          falha: {
            text: [{ text: 'O grafite borra o papel. Se havia algo ali, agora é só cinza.' }],
            effects: [{ type: 'flag', key: 'decalque_destruido' }],
          },
        },
      },
      {
        id: 'fundo_falso', image: 'obj_halcyon', label: 'Abrir o fundo falso da escrivaninha', kind: 'examinar', once: true,
        if: { flag: 'fundo_falso_revelado' },
        text: [{ text: 'Um painel de madeira cede com um clique. Dentro, um envelope pardo: fotocópias de transferências bancárias da Halcyon Holdings para contas numeradas nas Ilhas Cayman. Assinatura autorizada em todas: R. Whitmore.' }],
        effects: [{ type: 'clue', id: 'documentos_halcyon' }, { type: 'document', id: 'doc_halcyon' }],
      },
      {
        id: 'procurar_compartimento', label: 'Procurar compartimentos escondidos na escrivaninha', kind: 'investigar', once: true,
        if: { all: [{ used: 'apartamento:escrivaninha' }, { notFlag: 'fundo_falso_revelado' }] },
        hint: 'Raciocínio. Mecanismos e detalhes.',
        test: { kind: 'd20', label: 'Busca minuciosa', attribute: 'raciocinio', specialty: 'investigacao_de_campo', altSpecialties: ['arrombamento', 'seguranca_operacional'], tags: ['mecanismo', 'perceber_detalhes'], allowCooperation: true },
        outcomes: {
          sucesso: { text: [{ text: 'Batidas leves na madeira. Um som oco. Ali.' }], effects: [{ type: 'flag', key: 'fundo_falso_revelado' }] },
          falha: { text: [{ text: 'Madeira maciça, ou assim parece.' }] },
        },
      },
      {
        id: 'secretaria', image: 'obj_secretaria', label: 'Ouvir a secretária eletrônica', kind: 'examinar', once: true, timeCost: 15,
        text: [
          { text: 'A luz vermelha pisca. Três mensagens.' },
          { text: '“Thomas, sou eu. Me liga. Por favor.” — uma voz feminina, contida. Sábado, 21 de novembro.', speaker: 'Mensagem 1' },
          { text: '“Reed, os números não fecham e você sabe disso. Não leve aquilo a ninguém antes de falar comigo. Ninguém.” — voz masculina, grave, sotaque de Long Island. Sexta, 20 de novembro, 21h12.', speaker: 'Mensagem 2' },
          { text: 'Terça, 24 de novembro, 3h04. Silêncio. Uma respiração lenta, longa demais. Um som ritmado ao fundo, como gotas caindo numa superfície de metal. Clique.', speaker: 'Mensagem 3' },
        ],
        effects: [
          { type: 'clue', id: 'mensagens_secretaria' },
          { type: 'item', itemId: 'fita_secretaria' },
          { type: 'sanity', event: 'evidencia_estranha', who: 'todos' },
        ],
      },
      {
        id: 'banheiro', image: 'obj_banheiro', label: 'Examinar o banheiro', kind: 'investigar', once: true,
        hint: 'Raciocínio. Um sucesso revela mais — e cobra um preço.',
        text: [{ text: 'O cheiro de água sanitária vem daqui. Azulejos impecáveis, toalhas dobradas. Limpo demais.' }],
        test: { kind: 'd20', label: 'Medicina Legal', attribute: 'raciocinio', specialty: 'medicina_legal', altSpecialties: ['investigacao_de_campo', 'anatomia'], tags: ['perceber_detalhes'], allowCooperation: true },
        effects: [{ type: 'clue', id: 'vestigios_sangue' }],
        outcomes: {
          critico: {
            text: [
              { text: 'O rejunte em volta do ralo da banheira guarda um tom castanho que a água sanitária não levou. Muito sangue — litros, talvez. Nenhum respingo nas paredes, nenhum sinal de luta. Quem sangrou aqui já não se mexia.' },
              { text: 'Na borda da banheira, um resíduo cristalino. Heparina, ou algo parecido — anticoagulante de uso hospitalar.' },
            ],
            effects: [{ type: 'clue', id: 'vestigios_sangue', extra: 'Resíduo de anticoagulante de uso hospitalar na borda da banheira.' }, { type: 'sanity', event: 'horror_humano', who: 'todos' }],
          },
          sucesso: {
            text: [{ text: 'O rejunte em volta do ralo da banheira guarda um tom castanho que a água sanitária não levou. Muito sangue — litros, talvez. Nenhum respingo nas paredes, nenhum sinal de luta. Quem sangrou aqui já não se mexia.' }],
            effects: [{ type: 'clue', id: 'vestigios_sangue', extra: 'Grande quantidade de sangue; nenhum sinal de luta.' }, { type: 'sanity', event: 'horror_humano', who: 'todos' }],
          },
          falha: { text: [{ text: 'Há manchas escuras no rejunte, perto do ralo. Água sanitária demais para dizer o quê. Alguém quis apagar alguma coisa.' }] },
        },
      },
      {
        id: 'casaco', image: 'obj_fosforos', label: 'Revistar o casaco pendurado', kind: 'examinar', once: true,
        text: [{ text: 'Um sobretudo de cashmere, caro, esquecido no cabide — num inverno de três graus. No bolso, uma caixa de fósforos preta com letras prateadas: NOCTURNE — Ludlow St.' }],
        effects: [
          { type: 'item', itemId: 'fosforos_nocturne' },
          { type: 'clue', id: 'fosforos_nocturne' },
          { type: 'objective', id: 'obj_nocturne', status: 'ativo' },
        ],
      },
      {
        id: 'simbolo', image: 'obj_fosforos', label: 'Estudar o desenho dentro da caixa de fósforos', kind: 'investigar', once: true,
        if: { clue: 'fosforos_nocturne' },
        hint: 'Raciocínio. Símbolos e tradições.',
        text: [{ text: 'Por dentro da tampa, alguém desenhou a caneta um círculo cortado por uma linha vertical, cercado de pequenas marcas, como dentes.' }],
        test: { kind: 'd20', label: 'Simbologia', attribute: 'raciocinio', specialty: 'simbologia', altSpecialties: ['historia_oculta', 'folclore', 'religioes_crencas', 'rituais'], tags: ['perceber_detalhes'], allowCooperation: true },
        effects: [{ type: 'clue', id: 'simbolo_fosforos' }],
        outcomes: {
          sucesso: {
            text: [{ text: 'O desenho lembra marcas usadas em ritos funerários antigos do Mediterrâneo: sinais traçados em túmulos para manter os mortos onde estão. Ou, desenhados ao contrário, para chamá-los. Este está ao contrário.' }],
            effects: [{ type: 'clue', id: 'simbolo_fosforos', extra: 'Lembra marcas funerárias mediterrâneas — desenhada “ao contrário”, como um chamado.' }, { type: 'knowledge', delta: 1 }],
          },
          falha: { text: [{ text: 'Um rabisco. Talvez um logotipo, talvez nada.' }] },
        },
      },
      {
        id: 'janela', image: 'obj_seda', label: 'Observar a rua pela janela', kind: 'investigar', once: true,
        hint: 'Raciocínio. Perceber vigilância.',
        test: { kind: 'd20', label: 'Vigilância', attribute: 'raciocinio', specialty: 'vigilancia', altSpecialties: ['contrainteligencia', 'seguranca_operacional'], tags: ['perceber_ameaca', 'perceber_detalhes'] },
        outcomes: {
          critico: {
            text: [{ text: 'Do outro lado da rua, um sedã escuro com o motor ligado. Ninguém desce. O vidro está embaçado por dentro. A placa é de Nova Jersey e começa com “WR”.' }],
            effects: [{ type: 'clue', id: 'vigilancia_rua', extra: 'Placa de Nova Jersey começando com “WR”.' }, { type: 'flag', key: 'carro_vigiando' }],
          },
          sucesso: {
            text: [{ text: 'Do outro lado da rua, um sedã escuro com o motor ligado. Ninguém desce. O vidro está embaçado por dentro.' }],
            effects: [{ type: 'clue', id: 'vigilancia_rua' }, { type: 'flag', key: 'carro_vigiando' }],
          },
          falha: { text: [{ text: 'Táxis, um homem passeando com um cachorro, vapor saindo dos bueiros. Nada de anormal.' }] },
        },
      },
      {
        id: 'passos', image: 'cena_invasao', label: 'Passos no corredor…', kind: 'acao', timeCost: 0,
        if: { all: [{ used: 'apartamento:escrivaninha' }, { used: 'apartamento:secretaria' }, { notFlag: 'invasores_chegaram' }] },
        text: [{ text: 'Passos pesados no corredor. Param diante do 5C.' }],
        effects: [{ type: 'flag', key: 'invasores_chegaram' }, { type: 'goto', scene: 'invasao' }],
      },
      {
        id: 'sair', image: 'npc_invasores', label: 'Ir embora do apartamento', kind: 'mover', timeCost: 5,
        if: { notFlag: 'invasores_chegaram' },
        text: [{ text: 'Ao abrir a porta, dão de cara com dois homens no corredor. Um deles segura um molho de chaves. O outro, a mão dentro da jaqueta.' }],
        effects: [{ type: 'flag', key: 'invasores_chegaram' }, { type: 'goto', scene: 'invasao' }],
      },
      {
        id: 'sair_depois', label: 'Descer para a rua', kind: 'mover', timeCost: 5,
        if: { flag: 'invasores_resolvidos' },
        effects: [{ type: 'goto', scene: 'rua' }],
      },
    ],
  },
  {
    id: 'invasao',
    image: 'cena_invasao',
    npcs: ['invasores'],
    title: 'Apartamento 5C — visitantes',
    location: 'loc_apartamento',
    caseId: 'caso_reed',
    dangerSense: 'eles estão armados. Os dois.',
    intro: [
      { text: 'Dois homens de jaqueta de couro, vinte e poucos anos, olhos de quem não dorme direito. Um tem uma faca presa ao cinto. O outro mantém a mão direita escondida dentro da jaqueta.', if: { flag: 'invasores_chegaram' } },
      { text: 'Ainda não decidiram o que fazer. Vocês também não.' },
    ],
    interactions: [
      {
        id: 'esconder', label: 'Esconder-se antes que entrem', kind: 'acao', once: true, timeCost: 20,
        if: { used: 'apartamento:passos' },
        hint: 'Reflexo. Falhar significa ser descoberto.',
        test: { kind: 'd20', label: 'Furtividade', attribute: 'reflexo', specialty: 'furtividade', altSpecialties: ['infiltracao'], tags: ['passar_despercebido', 'movimentacao'] },
        outcomes: {
          sucesso: {
            text: [
              { text: 'Atrás da cortina, dentro do armário, no escuro do banheiro. Os dois entram, xingam a bagunça e começam a procurar.' },
              { text: '— O chefe quer a caderneta.', speaker: 'Invasor' },
              { text: '— Já levaram tudo da outra vez.', speaker: 'Outro invasor' },
              { text: '— Ele diz que o Reed fez cópias. Que deixou com alguém. Procura direito, que lá no Nocturne não aceitam desculpa.', speaker: 'Invasor' },
              { text: 'Vinte minutos depois, vão embora de mãos vazias.' },
            ],
            effects: [{ type: 'clue', id: 'conversa_invasores' }, { type: 'flag', key: 'invasores_resolvidos' }, { type: 'flag', key: 'invasores_evitados' }, { type: 'xp', amount: 2, who: 'todos' }, { type: 'goto', scene: 'apartamento' }],
          },
          falha: {
            text: [{ text: 'Um rangido no assoalho. O homem da faca se vira devagar. — Ora, ora.' }],
            effects: [{ type: 'combat', encounter: 'invasores' }],
          },
        },
      },
      {
        id: 'confrontar', image: 'npc_invasores', label: 'Encará-los e mandá-los embora', kind: 'acao', once: true,
        hint: 'Presença. Autoridade e impacto. Falhar provoca a briga.',
        test: { kind: 'd20', label: 'Interrogatório', attribute: 'presenca', specialty: 'interrogatorio', altSpecialties: ['persuasao', 'manipulacao', 'lideranca_tatica'], tags: ['autoridade', 'impacto_social'] },
        outcomes: {
          sucesso: {
            text: [
              { text: '— A polícia já está subindo. Vocês têm dez segundos.' },
              { text: 'Os dois trocam um olhar. Ninguém pagou o suficiente por isso. Recuam pelo corredor e descem a escada aos tropeços. Um papel amassado cai do bolso de um deles.' },
            ],
            effects: [{ type: 'item', itemId: 'bilhete_capanga' }, { type: 'clue', id: 'bilhete_invasor' }, { type: 'flag', key: 'invasores_resolvidos' }, { type: 'xp', amount: 2, who: 'todos' }, { type: 'goto', scene: 'apartamento' }],
          },
          falha: {
            text: [{ text: 'O homem da jaqueta ri. A mão sai de dentro do casaco segurando um revólver.' }],
            effects: [{ type: 'combat', encounter: 'invasores' }],
          },
        },
      },
      {
        id: 'atacar', label: 'Atacar primeiro', kind: 'acao', once: true, timeCost: 0,
        hint: 'Inicia o combate. A violência tem consequências.',
        effects: [{ type: 'decision', id: 'atacou_invasores', label: 'Atacou primeiro os invasores do 5C.' }, { type: 'combat', encounter: 'invasores' }],
      },
      {
        id: 'fugir_incendio', label: 'Fugir pela escada de incêndio', kind: 'acao', once: true,
        hint: 'Reflexo. Falhar significa ficar encurralado.',
        test: { kind: 'd20', label: 'Evasão', attribute: 'reflexo', specialty: 'evasao', altSpecialties: ['sobrevivencia'], tags: ['movimentacao', 'equilibrio'] },
        outcomes: {
          sucesso: {
            text: [{ text: 'A janela cede, o ferro da escada de incêndio queima de frio nas mãos. Cinco andares depois, o beco. Lá em cima, alguém grita.' }],
            effects: [{ type: 'flag', key: 'invasores_resolvidos' }, { type: 'flag', key: 'fugiu_apartamento' }, { type: 'goto', scene: 'rua' }],
          },
          falha: {
            text: [{ text: 'A janela está emperrada pela tinta velha. Quando cede, já é tarde.' }],
            effects: [{ type: 'combat', encounter: 'invasores' }],
          },
        },
      },
    ],
  },
  {
    id: 'rua',
    image: 'cena_rua',
    phone: {},
    title: 'Rua 78 Leste — noite',
    location: 'loc_rua78',
    caseId: 'caso_reed',
    intro: [
      { text: 'O frio corta. Vapor sobe dos bueiros como se a cidade respirasse.' },
      { text: 'Lá em cima, no quinto andar, alguém não vai voltar para casa esta noite. Sirenes já soam ao longe — Sal deve ter ligado para a polícia. Amanhã, isso estará nos jornais. Ou não, o que seria pior.', if: { flag: 'mortes_em_combate' } },
      { text: 'O sedã escuro que vigiava o prédio dá partida e some na esquina da Lexington.', if: { flag: 'carro_vigiando' } },
    ],
    onEnter: [{ type: 'objective', id: 'obj_apartamento', status: 'concluido' }],
    interactions: [
      {
        id: 'voltar_escritorio', label: 'Voltar ao escritório e reunir o que descobriram', kind: 'mover', timeCost: 40,
        effects: [{ type: 'goto', scene: 'fim_capitulo' }],
      },
    ],
  },
  {
    id: 'fim_capitulo',
    image: 'cena_fim',
    phone: {},
    title: 'Midtown — madrugada',
    location: 'loc_escritorio',
    caseId: 'caso_reed',
    intro: [
      { text: 'Café requentado, a luz amarela do abajur, as pistas espalhadas sobre a mesa como cartas de um jogo cujas regras ninguém explicou.' },
      { text: 'Thomas Reed não viajou. Alguém revirou seu apartamento atrás de papéis, e alguém limpou muito sangue daquele banheiro.', if: { clue: 'vestigios_sangue' } },
      { text: 'As iniciais R.W. aparecem onde não deveriam. Richard Whitmore — ou alguém que quer que pareça ser ele.', if: { any: [{ clue: 'agenda_decalque' }, { clue: 'documentos_halcyon' }] } },
      { text: 'Um nome volta sempre: Nocturne, na Ludlow Street.', if: { any: [{ clue: 'fosforos_nocturne' }, { clue: 'conversa_invasores' }] } },
      { text: 'E aquele símbolo dentro da caixa de fósforos não sai da cabeça de ninguém.', if: { clue: 'simbolo_fosforos' } },
      { text: 'Daniel ainda pensa no paciente do Bellevue. Na palidez. Nas duas perfurações. No prontuário que sumiu.', if: { hasCharacter: 'daniel' } },
      { text: 'Liz relê a notícia do Pier 40. Corpos sem nome. Registros incompletos. Ela conhece alguém na funerária que talvez fale — se ainda estiver disposto.', if: { hasCharacter: 'liz' } },
      { text: 'Fim do primeiro capítulo de demonstração. A cidade continua se movendo: o que vocês fizerem a seguir — e o que deixarem de fazer — terá consequências.' },
    ],
    onEnter: [
      { type: 'xp', amount: 5, who: 'todos' },
      { type: 'event', text: 'Primeira noite de investigação sobre o desaparecimento de Thomas Reed.' },
      { type: 'case', id: 'caso_voice', status: 'aguardando' },
      { type: 'objective', id: 'obj_voice', status: 'ativo' },
      { type: 'endChapter' },
    ],
    interactions: [
      {
        id: 'descansar', label: 'Descansar até a manhã seguinte', kind: 'esperar', timeCost: 0,
        text: [{ text: 'Algumas horas de sono ruim no sofá e nas cadeiras. Lá fora, a cidade não dorme.' }],
        effects: [{ type: 'restUntil', hour: 8 }],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Diálogos
// ---------------------------------------------------------------------------

export const REED_DIALOGUES: Dialogue[] = [
  {
    id: 'victoria',
    npc: 'victoria',
    image: 'npc_victoria',
    start: 'chegada',
    nodes: {
      chegada: {
        text: [
          { text: 'A mulher que entra parece ter saído de outra década — ou de outro lugar. Vestido vermelho extravagante, sobretudo vermelho até os tornozelos, óculos escuros apesar da noite. Ela não tira as luvas.' },
          { text: 'Não se apresenta. Olha o escritório como quem avalia um imóvel que não pretende comprar, escolhe a cadeira mais distante da janela e se senta sem esperar convite.' },
          { text: '— Disseram-me que Jack Sullivan não está. — Uma pausa. — Não tenho tempo para esperar por ele.', speaker: 'npc', if: { contactIsNot: 'jack' } },
          { text: '— Preciso que encontre um homem.', speaker: 'npc' },
        ],
        effects: [{ type: 'objective', id: 'obj_ouvir_cliente', status: 'concluido' }, { type: 'objective', id: 'obj_decidir', status: 'ativo' }],
        options: [
          { id: 'nome', label: 'Antes disso: com quem eu estou falando?', next: 'nome' },
          { id: 'quem', label: 'Quem é o homem?', next: 'thomas' },
        ],
      },
      conversa: {
        // Nó de retorno: não repete nenhum texto.
        text: [],
        options: [
          { id: 'nome', label: 'Com quem eu estou falando, afinal?', once: true, if: { notFlag: 'victoria_nome' }, next: 'nome' },
          { id: 'quem', label: 'Quem é o homem?', if: { notClue: 'thomas_desaparecido' }, next: 'thomas' },
          { id: 'morto', label: 'Por que acha que ele está morto?', once: true, if: { clue: 'thomas_desaparecido' }, next: 'morto' },
          { id: 'policia', label: 'E por que não procurou a polícia?', once: true, if: { clue: 'thomas_desaparecido' }, next: 'policia' },
          { id: 'marido', label: 'Fale sobre o seu marido.', once: true, if: { used: 'dlg:victoria:policia' }, next: 'richard' },
          { id: 'pagamento', label: 'E quanto ao pagamento?', once: true, if: { clue: 'thomas_desaparecido' }, next: 'pagamento' },
          {
            id: 'observar', label: '(Observar a cliente com atenção)', once: true,
            test: { kind: 'd20', label: 'Análise Comportamental', attribute: 'raciocinio', specialty: 'analise_comportamental', altSpecialties: ['perfil_psicologico', 'psiquiatria'], tags: ['interpretar_pessoas', 'perceber_detalhes'] },
            outcomes: {
              critico: {
                text: [
                  { text: 'Ela não tira os óculos escuros em momento algum, nem quando a luz do abajur bate direto em seu rosto. Fala de Thomas no passado sem perceber. As mãos, quando enfim tira uma das luvas, estão frias — mas o escritório está aquecido há horas.' },
                  { text: 'E há outra coisa: ela não mente sobre amar Thomas. Mente sobre outra coisa. Sobre o motivo de ter vindo justamente até aqui.' },
                ],
                effects: [{ type: 'clue', id: 'victoria_observada', extra: 'Ela não mente sobre amar Thomas; mente sobre o motivo de ter vindo até aqui.' }],
              },
              sucesso: {
                text: [{ text: 'Ela não tira os óculos escuros em momento algum, nem quando a luz do abajur bate direto em seu rosto. Fala de Thomas no passado sem perceber. As mãos, quando enfim tira uma das luvas, estão frias — mas o escritório está aquecido há horas.' }],
                effects: [{ type: 'clue', id: 'victoria_observada' }],
              },
              falha: {
                text: [{ text: '— Está me examinando ou me ouvindo? — Ela inclina a cabeça. Atrás das lentes escuras, nada se deixa ler.', speaker: 'npc' }],
                effects: [{ type: 'trust', npc: 'victoria', delta: -1 }],
              },
            },
          },
          { id: 'aceitar', label: 'Aceito o caso.', if: { clue: 'thomas_desaparecido' }, next: 'aceite' },
          { id: 'recusar', label: 'Sinto muito. Não posso aceitar.', if: { clue: 'thomas_desaparecido' }, next: 'recusa' },
        ],
      },
      nome: {
        text: [
          { text: 'Ela demora um instante, como quem decide se a pergunta merece resposta.' },
          { text: '— Victoria. — Outra pausa, mais curta. — Victoria Whitmore. O sobrenome talvez lhe diga alguma coisa. Preferiria que não dissesse.', speaker: 'npc' },
        ],
        effects: [{ type: 'meet', npc: 'victoria' }, { type: 'flag', key: 'victoria_nome' }],
        options: [{ id: 'voltar', label: '(Continuar)', next: 'conversa' }],
      },
      thomas: {
        text: [
          { text: '— Thomas Reed. Trinta e oito anos. Consultor financeiro. — Ela faz uma pausa curta. — Desapareceu há onze dias.', speaker: 'npc' },
          { text: '— Ele é meu amante. Não vou fingir o contrário, não temos tempo para isso. — A voz não treme. — E eu acredito que ele esteja morto.', speaker: 'npc' },
        ],
        effects: [{ type: 'clue', id: 'thomas_desaparecido' }, { type: 'meet', npc: 'thomas' }],
        options: [{ id: 'voltar', label: '(Continuar)', next: 'conversa' }],
      },
      morto: {
        text: [
          { text: '— Porque em dois anos ele nunca passou um dia sem me telefonar. Nem um. — Ela finalmente tira uma das luvas, dedo por dedo. — E porque eu sinto. Pode chamar isso do que quiser.', speaker: 'npc' },
        ],
        options: [{ id: 'voltar', label: '(Continuar)', next: 'conversa' }],
      },
      policia: {
        // CANÔNICO: diálogo preservado integralmente.
        text: [
          { text: 'Victoria ficou em silêncio por alguns instantes.' },
          { text: '— Você sabe que não posso.', speaker: 'npc' },
          { text: 'Disse com um olhar quase acusatório e um semblante de ligeira vergonha. Uma expressão facial nada fácil de ler.' },
          { text: 'Jack ergueu as sobrancelhas, esperando uma confissão mais detalhada.', if: { contactIs: 'jack' } },
          { text: '{contato} ergueu as sobrancelhas, esperando uma confissão mais detalhada.', if: { contactIsNot: 'jack' } },
          { text: '— Meu marido tem amigos na polícia. Amigos em lugares que você provavelmente nem imagina. Se ele descobrir sobre Thomas, não haverá investigação alguma. E, se descobrir que estou procurando por ele, terei problemas muito maiores.', speaker: 'npc' },
        ],
        effects: [{ type: 'clue', id: 'richard_influencia' }, { type: 'meet', npc: 'richard' }, { type: 'meet', npc: 'victoria' }],
        options: [{ id: 'voltar', label: '(Continuar)', next: 'conversa' }],
      },
      richard: {
        text: [
          { text: '— Richard Whitmore. Investimentos, imóveis, um assento em conselhos de que você nunca ouviu falar. — Ela olha direto para Jack. — E empresta dinheiro a homens desesperados. Sei o que meu marido empresta, e a quem.', speaker: 'npc', if: { contactIs: 'jack' } },
          { text: 'Jack sente o estômago afundar. Trezentos mil dólares. Ela sabe.', if: { contactIs: 'jack' } },
          { text: '— Richard Whitmore. Investimentos, imóveis, um assento em conselhos de que você nunca ouviu falar. E empresta dinheiro a homens desesperados. — Uma pausa. — Jack Sullivan é um deles. Talvez por isso ele não esteja aqui.', speaker: 'npc', if: { contactIsNot: 'jack' } },
        ],
        effects: [{ type: 'clue', id: 'divida_richard', extra: 'Victoria sabe da dívida de Jack com Richard.' }, { type: 'meet', npc: 'victoria' }],
        options: [{ id: 'voltar', label: '(Continuar)', next: 'conversa' }],
      },
      pagamento: {
        text: [
          { text: '— Dois milhões de dólares. — Ela diz o número como quem comenta o tempo. — Metade quando me disserem o que aconteceu com ele. A outra metade quando eu tiver certeza.', speaker: 'npc' },
          { text: 'Jack faz as contas sem querer. Dois milhões pagam a dívida com Richard Whitmore seis vezes.', if: { contactIs: 'jack' } },
        ],
        effects: [{ type: 'flag', key: 'oferta_conhecida' }],
        options: [{ id: 'voltar', label: '(Continuar)', next: 'conversa' }],
      },
      aceite: {
        text: [
          { text: 'Ela assente uma vez, como se nunca tivesse duvidado.' },
          { text: '— Ele morava na Rua 78 Leste, número 211, apartamento 5C. — Ela coloca sobre a mesa uma chave, uma fotografia e um cartão cor de vinho. — O porteiro se chama Sal. É discreto. Não confie em ninguém que diga trabalhar para mim.', speaker: 'npc' },
          { text: 'No cartão, apenas um nome e um telefone: Victoria Whitmore.', if: { notFlag: 'victoria_nome' } },
          { text: 'Quando ela sai, o corredor fica frio por um tempo que ninguém comenta. O telefone sobre a mesa parece maior agora — talvez seja hora de chamar reforços.' },
        ],
        effects: [
          { type: 'meet', npc: 'victoria' },
          { type: 'flag', key: 'caso_aceito' },
          { type: 'flag', key: 'victoria_saiu' },
          { type: 'decision', id: 'aceitou_caso', label: 'Aceitou o caso de Victoria Whitmore.' },
          { type: 'trust', npc: 'victoria', delta: 1 },
          { type: 'item', itemId: 'chave_apartamento' },
          { type: 'item', itemId: 'foto_thomas' },
          { type: 'item', itemId: 'cartao_victoria' },
          { type: 'clue', id: 'endereco_thomas' },
          { type: 'objective', id: 'obj_decidir', status: 'concluido' },
          { type: 'objective', id: 'obj_encontrar_thomas', status: 'ativo' },
          { type: 'objective', id: 'obj_apartamento', status: 'ativo' },
          { type: 'time', minutes: 20 },
        ],
        options: [{ id: 'fim', label: '(Encerrar a conversa)', next: null }],
      },
      recusa: {
        text: [
          { text: 'Ela não discute. Coloca um cartão cor de vinho sobre a mesa.' },
          { text: '— Thomas morava na Rua 78 Leste, número 211. Se mudar de ideia, já sabe por onde começar. E onde me encontrar.', speaker: 'npc' },
          { text: 'No cartão, apenas um nome e um telefone: Victoria Whitmore.', if: { notFlag: 'victoria_nome' } },
          { text: 'Quando ela sai, o corredor fica frio por um tempo que ninguém comenta.' },
        ],
        effects: [
          { type: 'meet', npc: 'victoria' },
          { type: 'flag', key: 'caso_recusado' },
          { type: 'flag', key: 'victoria_saiu' },
          { type: 'decision', id: 'recusou_caso', label: 'Recusou o caso de Victoria Whitmore.' },
          { type: 'trust', npc: 'victoria', delta: -2 },
          { type: 'item', itemId: 'cartao_victoria' },
          { type: 'clue', id: 'endereco_thomas' },
        ],
        options: [{ id: 'fim', label: '(Encerrar a conversa)', next: null }],
      },
    },
  },
  {
    id: 'sal',
    npc: 'sal',
    image: 'npc_sal',
    start: 'balcao',
    nodes: {
      balcao: {
        text: [{ text: '— Boa noite. Posso ajudar? — Sal abaixa o volume da TV sem tirar os olhos da tela.', speaker: 'npc' }],
        options: [
          { id: 'reed', label: 'Estamos procurando Thomas Reed, do 5C.', next: 'reed' },
          { id: 'sair', label: 'Só estamos de passagem.', next: null },
        ],
      },
      reed: {
        text: [
          { text: '— O senhor Reed? Faz uns dias que não vejo. Viajou, acho. — Ele desvia o olhar para a televisão um segundo rápido demais.', speaker: 'npc', if: { all: [{ notFlag: 'sal_contou' }, { notFlag: 'sal_perguntado' }] } },
          { text: '— Já contei o que sei. — Sal suspira. — Tomem cuidado lá em cima.', speaker: 'npc', if: { all: [{ flag: 'sal_contou' }] } },
        ],
        effects: [{ type: 'flag', key: 'sal_perguntado' }],
        options: [
          {
            id: 'persuadir', label: 'Ninguém aqui quer te criar problema, Sal. Só queremos saber o que aconteceu com ele.', once: true,
            if: { notFlag: 'sal_contou' },
            test: { kind: 'd20', label: 'Persuasão', attribute: 'presenca', specialty: 'persuasao', altSpecialties: ['entrevistas', 'fontes_contatos', 'interrogatorio'], tags: ['persuasao', 'argumentacao', 'empatia'], allowCooperation: true },
            outcomes: {
              critico: {
                text: [
                  { text: '— Olha... não quero encrenca. Três noites atrás vieram dois sujeitos dizendo que eram da seguradora. Seguradora não vem às onze da noite. Subiram, ficaram meia hora, saíram com uma caixa de arquivo.', speaker: 'Sal' },
                  { text: '— E tem outra coisa. Na noite em que o senhor Reed sumiu, ele saiu tarde, sozinho, sem casaco. Num frio daqueles. Como quem vai só até a esquina e volta.', speaker: 'Sal' },
                ],
                effects: [{ type: 'clue', id: 'visitantes_apartamento', extra: 'Na noite do desaparecimento, Thomas saiu tarde, sozinho e sem casaco.' }, { type: 'trust', npc: 'sal', delta: 1 }, { type: 'flag', key: 'sal_contou' }],
              },
              sucesso: {
                text: [{ text: '— Olha... não quero encrenca. Três noites atrás vieram dois sujeitos dizendo que eram da seguradora. Seguradora não vem às onze da noite. Subiram, ficaram meia hora, saíram com uma caixa de arquivo.', speaker: 'Sal' }],
                effects: [{ type: 'clue', id: 'visitantes_apartamento' }, { type: 'trust', npc: 'sal', delta: 1 }, { type: 'flag', key: 'sal_contou' }],
              },
              falha: {
                text: [{ text: '— Eu já disse o que sei. Vocês querem que eu chame alguém?', speaker: 'Sal' }],
                effects: [{ type: 'trust', npc: 'sal', delta: -1 }, { type: 'flag', key: 'sal_desconfiado' }],
              },
            },
          },
          {
            id: 'pressionar', label: 'Você vai falar agora, ou vai falar com a polícia depois.', once: true,
            if: { notFlag: 'sal_contou' },
            test: { kind: 'd20', label: 'Interrogatório', attribute: 'presenca', specialty: 'interrogatorio', altSpecialties: ['manipulacao'], tags: ['autoridade', 'impacto_social'] },
            outcomes: {
              sucesso: {
                text: [{ text: 'Sal engole em seco. — Tá bom, tá bom. Três noites atrás, dois sujeitos da “seguradora”. Às onze da noite. Saíram com uma caixa. Satisfeitos?', speaker: 'Sal' }],
                effects: [{ type: 'clue', id: 'visitantes_apartamento' }, { type: 'trust', npc: 'sal', delta: -1 }, { type: 'flag', key: 'sal_contou' }],
              },
              falha: {
                text: [{ text: 'Sal pega o telefone. — Engraçado. Vamos ver o que a polícia acha de vocês.', speaker: 'Sal' }],
                effects: [{ type: 'trust', npc: 'sal', delta: -2 }, { type: 'flag', key: 'sal_chamou_policia' }, { type: 'track', track: 'risco_protagonistas', delta: 2 }, { type: 'attention', faction: 'policia', delta: 1 }, { type: 'event', text: 'O porteiro do prédio de Thomas Reed chamou a polícia por causa do grupo.' }],
              },
            },
          },
          {
            id: 'foto', label: '(Mostrar a fotografia de Thomas)', once: true,
            if: { hasItem: 'foto_thomas' },
            effects: [{ type: 'trust', npc: 'sal', delta: 1 }],
            next: 'foto',
          },
          { id: 'voltar', label: 'Obrigado, Sal.', next: null },
        ],
      },
      perguntas: {
        text: [],
        options: [
          {
            id: 'persuadir', label: 'Ninguém aqui quer te criar problema, Sal. Só queremos saber o que aconteceu com ele.', once: true,
            if: { notFlag: 'sal_contou' },
            test: { kind: 'd20', label: 'Persuasão', attribute: 'presenca', specialty: 'persuasao', altSpecialties: ['entrevistas', 'fontes_contatos', 'interrogatorio'], tags: ['persuasao', 'argumentacao', 'empatia'], allowCooperation: true },
            outcomes: {
              critico: {
                text: [
                  { text: '— Olha... não quero encrenca. Três noites atrás vieram dois sujeitos dizendo que eram da seguradora. Seguradora não vem às onze da noite. Subiram, ficaram meia hora, saíram com uma caixa de arquivo.', speaker: 'Sal' },
                  { text: '— E tem outra coisa. Na noite em que o senhor Reed sumiu, ele saiu tarde, sozinho, sem casaco. Num frio daqueles. Como quem vai só até a esquina e volta.', speaker: 'Sal' },
                ],
                effects: [{ type: 'clue', id: 'visitantes_apartamento', extra: 'Na noite do desaparecimento, Thomas saiu tarde, sozinho e sem casaco.' }, { type: 'trust', npc: 'sal', delta: 1 }, { type: 'flag', key: 'sal_contou' }],
              },
              sucesso: {
                text: [{ text: '— Olha... não quero encrenca. Três noites atrás vieram dois sujeitos dizendo que eram da seguradora. Seguradora não vem às onze da noite. Subiram, ficaram meia hora, saíram com uma caixa de arquivo.', speaker: 'Sal' }],
                effects: [{ type: 'clue', id: 'visitantes_apartamento' }, { type: 'trust', npc: 'sal', delta: 1 }, { type: 'flag', key: 'sal_contou' }],
              },
              falha: {
                text: [{ text: '— Eu já disse o que sei. Vocês querem que eu chame alguém?', speaker: 'Sal' }],
                effects: [{ type: 'trust', npc: 'sal', delta: -1 }, { type: 'flag', key: 'sal_desconfiado' }],
              },
            },
          },
          {
            id: 'pressionar', label: 'Você vai falar agora, ou vai falar com a polícia depois.', once: true,
            if: { notFlag: 'sal_contou' },
            test: { kind: 'd20', label: 'Interrogatório', attribute: 'presenca', specialty: 'interrogatorio', altSpecialties: ['manipulacao'], tags: ['autoridade', 'impacto_social'] },
            outcomes: {
              sucesso: {
                text: [{ text: 'Sal engole em seco. — Tá bom, tá bom. Três noites atrás, dois sujeitos da “seguradora”. Às onze da noite. Saíram com uma caixa. Satisfeitos?', speaker: 'Sal' }],
                effects: [{ type: 'clue', id: 'visitantes_apartamento' }, { type: 'trust', npc: 'sal', delta: -1 }, { type: 'flag', key: 'sal_contou' }],
              },
              falha: {
                text: [{ text: 'Sal pega o telefone. — Engraçado. Vamos ver o que a polícia acha de vocês.', speaker: 'Sal' }],
                effects: [{ type: 'trust', npc: 'sal', delta: -2 }, { type: 'flag', key: 'sal_chamou_policia' }, { type: 'track', track: 'risco_protagonistas', delta: 2 }, { type: 'attention', faction: 'policia', delta: 1 }, { type: 'event', text: 'O porteiro do prédio de Thomas Reed chamou a polícia por causa do grupo.' }],
              },
            },
          },
          {
            id: 'foto', label: '(Mostrar a fotografia de Thomas)', once: true,
            if: { hasItem: 'foto_thomas' },
            effects: [{ type: 'trust', npc: 'sal', delta: 1 }],
            next: 'foto',
          },
          { id: 'voltar', label: 'Obrigado, Sal.', next: null },
        ],
      },
      foto: {
        text: [{ text: '— É ele, sim. Gente boa. Sempre deixava gorjeta no Natal. — Sal devolve a foto com cuidado. — Esse ano eu não sei, né.', speaker: 'npc' }],
        options: [{ id: 'voltar', label: '(Continuar)', next: 'perguntas' }],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Encontros
// ---------------------------------------------------------------------------

export const REED_ENCOUNTERS: EncounterDef[] = [
  {
    id: 'invasores',
    title: 'Os invasores do 5C',
    intro: 'O espaço é estreito: a sala revirada, o corredor, a porta aberta. Não há para onde recuar com elegância.',
    enemies: ['criminoso_faca', 'criminoso_revolver'],
    environment: [
      { id: 'gritar', label: 'Gritar por socorro e pelo porteiro', description: 'O grito ecoa pelo poço da escada. Lá embaixo, Sal berra que está chamando a polícia. Os invasores hesitam.', attribute: 'presenca', effect: 'quebrar_moral' },
    ],
    onVictory: [
      { type: 'item', itemId: 'bilhete_capanga' },
      { type: 'clue', id: 'bilhete_invasor' },
      { type: 'flag', key: 'invasores_resolvidos' },
      { type: 'flag', key: 'invasores_derrotados' },
      { type: 'track', track: 'risco_protagonistas', delta: 1 },
      { type: 'attention', faction: 'policia', delta: 1 },
      { type: 'xp', amount: 3, who: 'todos' },
      { type: 'goto', scene: 'apartamento' },
    ],
    onEnemiesFled: [
      { type: 'item', itemId: 'bilhete_capanga' },
      { type: 'clue', id: 'bilhete_invasor' },
      { type: 'flag', key: 'invasores_resolvidos' },
      { type: 'narrate', text: 'Na fuga, um deles deixou cair um papel amassado.' },
      { type: 'xp', amount: 3, who: 'todos' },
      { type: 'goto', scene: 'apartamento' },
    ],
    onFlee: [
      { type: 'flag', key: 'invasores_resolvidos' },
      { type: 'flag', key: 'fugiu_apartamento' },
      { type: 'track', track: 'risco_protagonistas', delta: 1 },
      { type: 'goto', scene: 'rua' },
    ],
    onDefeat: [],
  },
];

// ---------------------------------------------------------------------------
// Pistas, NPCs, documentos e objetivos
// ---------------------------------------------------------------------------

export const REED_CLUES: ClueDef[] = [
  { id: 'thomas_desaparecido', image: 'npc_thomas', caseId: 'caso_reed', importance: 'essencial', title: 'Thomas Reed desapareceu', description: 'Thomas Reed, 38 anos, consultor financeiro, desapareceu há onze dias. É amante da cliente, que acredita que ele esteja morto.', location: 'loc_escritorio', characters: ['victoria', 'thomas'], related: ['endereco_thomas'], memoryDetail: 'A cliente se referiu a Thomas no passado duas vezes antes de dizer que acreditava que ele estivesse morto.' },
  { id: 'endereco_thomas', caseId: 'caso_reed', importance: 'essencial', title: 'Endereço de Thomas Reed', description: 'Rua 78 Leste, nº 211, apartamento 5C, Upper East Side. O porteiro se chama Sal.', location: 'loc_escritorio', characters: ['victoria', 'sal'], related: ['thomas_desaparecido'] },
  { id: 'richard_influencia', caseId: 'caso_reed', importance: 'importante', title: 'Os amigos de Richard Whitmore', description: 'Segundo Victoria, o marido tem amigos na polícia e “em lugares que você provavelmente nem imagina”. Ela não pode procurar a polícia.', location: 'loc_escritorio', characters: ['victoria', 'richard'], related: ['divida_richard'] },
  { id: 'divida_richard', image: 'obj_promissoria', caseId: 'caso_reed', importance: 'importante', title: 'A dívida de Jack', description: 'Jack Sullivan deve trezentos mil dólares a Richard Whitmore.', location: 'loc_escritorio', characters: ['richard'], related: ['richard_influencia', 'documentos_halcyon'] },
  { id: 'victoria_observada', image: 'npc_victoria', caseId: 'caso_reed', importance: 'secundaria', title: 'Algo em Victoria', description: 'Não tirou os óculos escuros. Falou de Thomas no passado. Mãos frias num escritório aquecido.', location: 'loc_escritorio', characters: ['victoria'], related: [] },
  { id: 'visitantes_apartamento', caseId: 'caso_reed', importance: 'importante', title: 'Os homens da “seguradora”', description: 'Três noites atrás, dois homens dizendo ser de uma seguradora subiram ao 5C às onze da noite e saíram com uma caixa de arquivo.', location: 'loc_predio_thomas', characters: ['sal'], related: ['busca_profissional', 'conversa_invasores'] },
  { id: 'apartamento_revirado', image: 'cena_apartamento', caseId: 'caso_reed', importance: 'essencial', title: 'Apartamento revirado', description: 'O apartamento foi revistado, mas objetos de valor — inclusive um Rolex de ouro — ficaram intocados.', location: 'loc_apartamento', characters: ['thomas'], related: ['busca_profissional'] },
  { id: 'busca_profissional', caseId: 'caso_reed', importance: 'importante', title: 'Uma busca profissional', description: 'Quem revistou o apartamento procurava papéis e trabalhou com método, sem fazer barulho.', location: 'loc_apartamento', characters: [], related: ['apartamento_revirado', 'visitantes_apartamento'] },
  { id: 'agenda_thomas', image: 'obj_agenda', caseId: 'caso_reed', importance: 'essencial', title: 'A agenda de Thomas', description: 'Compromissos meticulosos até 19 de novembro. As páginas seguintes foram arrancadas.', location: 'loc_apartamento', characters: ['thomas'], related: ['agenda_decalque'], memoryDetail: 'Na última página intacta, a letra de Thomas fica mais apertada e inclinada — como a de alguém com pressa ou com medo.' },
  { id: 'agenda_decalque', image: 'obj_agenda', caseId: 'caso_reed', importance: 'importante', title: '“R.W. — Ludlow”', description: 'Marcas na agenda: “20/11 — 23h — R.W. — Ludlow. Levar as cópias.”', location: 'loc_apartamento', characters: ['thomas'], related: ['agenda_thomas', 'fosforos_nocturne', 'divida_richard'] },
  { id: 'documentos_halcyon', image: 'obj_halcyon', caseId: 'caso_reed', importance: 'importante', title: 'Transferências da Halcyon Holdings', description: 'Fotocópias de transferências da Halcyon Holdings para contas numeradas nas Ilhas Cayman, todas autorizadas por “R. Whitmore”.', location: 'loc_apartamento', characters: ['richard', 'thomas'], related: ['agenda_decalque', 'mensagens_secretaria'] },
  { id: 'mensagens_secretaria', image: 'obj_secretaria', caseId: 'caso_reed', importance: 'importante', title: 'Três mensagens', description: 'Uma mulher pedindo que Thomas ligue (21/11). Um homem dizendo que “os números não fecham” (20/11). E uma ligação silenciosa às 3h04 de 24/11, com um som de gotas ao fundo.', location: 'loc_apartamento', characters: ['thomas'], related: ['documentos_halcyon'], memoryDetail: 'A voz da primeira mensagem é a de Victoria Whitmore. A do homem, não é a de ninguém que vocês já tenham ouvido.' },
  { id: 'vestigios_sangue', image: 'obj_banheiro', caseId: 'caso_reed', importance: 'essencial', title: 'O banheiro limpo demais', description: 'O banheiro foi lavado com água sanitária. Restam manchas escuras no rejunte, perto do ralo da banheira.', location: 'loc_apartamento', characters: ['thomas'], related: ['prontuario_desaparecido'] },
  { id: 'fosforos_nocturne', image: 'obj_fosforos', caseId: 'caso_reed', importance: 'essencial', title: 'Nocturne — Ludlow St.', description: 'Uma caixa de fósforos de um lugar chamado Nocturne, na Ludlow Street, Lower East Side, no bolso do casaco de Thomas.', location: 'loc_apartamento', characters: ['thomas'], related: ['agenda_decalque', 'conversa_invasores', 'simbolo_fosforos'] },
  { id: 'simbolo_fosforos', image: 'obj_fosforos', caseId: 'caso_reed', importance: 'importante', title: 'O símbolo na caixa de fósforos', description: 'Um círculo cortado por uma linha vertical, cercado de pequenas marcas, desenhado à caneta.', location: 'loc_apartamento', characters: [], related: ['fosforos_nocturne'] },
  { id: 'vigilancia_rua', image: 'obj_seda', caseId: 'caso_reed', importance: 'secundaria', title: 'O sedã escuro', description: 'Um carro escuro com o motor ligado vigiava o prédio de Thomas.', location: 'loc_apartamento', characters: [], related: [] },
  { id: 'conversa_invasores', caseId: 'caso_reed', importance: 'importante', title: '“Lá no Nocturne não aceitam desculpa”', description: 'Os invasores procuravam uma caderneta. O “chefe” acredita que Reed fez cópias e as deixou com alguém. Eles respondem a alguém ligado ao Nocturne.', location: 'loc_apartamento', characters: [], related: ['fosforos_nocturne', 'visitantes_apartamento'] },
  { id: 'bilhete_invasor', caseId: 'caso_reed', importance: 'importante', title: 'O bilhete do invasor', description: 'Um papel amassado com um endereço e um horário.', location: 'loc_apartamento', characters: [], related: ['conversa_invasores', 'fosforos_nocturne'] },
  // Ganchos para as outras investigações
  { id: 'noticia_corpos', image: 'obj_jornal', caseId: 'caso_voice', importance: 'secundaria', title: 'Corpo sem identificação no Pier 40', description: 'Segundo o Daily News, é o terceiro corpo não identificado em novembro. Sem nome, sem causa da morte.', location: 'loc_escritorio', characters: [], related: [] },
  { id: 'prontuario_desaparecido', caseId: 'caso_bellevue', importance: 'secundaria', title: 'O prontuário desaparecido', description: 'O prontuário do paciente que morreu no Bellevue, com perda sanguínea inexplicável, sumiu do arquivo depois da visita de um homem de terno escuro.', location: 'loc_escritorio', characters: ['daniel'], related: ['vestigios_sangue'] },
];

export const REED_NPCS: NpcDef[] = [
  { id: 'victoria', gender: 'f', name: 'Victoria Whitmore', alias: 'A mulher de vermelho', publicRole: 'Cliente. Procura Thomas Reed, seu amante.', location: 'Desconhecida', initialTrust: 0, publicNotes: 'Roupas vermelhas extravagantes, óculos escuros, sobretudo vermelho. Casada com Richard Whitmore.' },
  { id: 'thomas', gender: 'm', name: 'Thomas Reed', publicRole: 'Consultor financeiro desaparecido.', location: 'Desconhecida', initialTrust: 0, publicNotes: '38 anos. Desaparecido há onze dias em 1º de dezembro de 1992.' },
  { id: 'richard', gender: 'm', name: 'Richard Whitmore', publicRole: 'Marido de Victoria. Credor de Jack Sullivan.', location: 'Manhattan', initialTrust: 0, publicNotes: 'Influente, com amigos na polícia.' },
  { id: 'sal', gender: 'm', voiceNames: ['Sal'], name: 'Sal Benedetto', publicRole: 'Porteiro do prédio de Thomas Reed.', location: 'Rua 78 Leste, nº 211', initialTrust: 0, publicNotes: 'Sessenta e poucos anos, torcedor dos Knicks.' },
  { id: 'invasores', gender: 'm', voiceNames: ['Invasor', 'Outro invasor'], name: 'Os invasores', publicRole: 'Dois homens que invadiram o apartamento de Thomas Reed.', location: 'Rua 78 Leste, nº 211', initialTrust: 0, publicNotes: 'Jaquetas de couro, vinte e poucos anos.' },
];

export const REED_DOCUMENTS: DocumentDef[] = [
  { id: 'doc_foto_thomas', title: 'Fotografia de Thomas Reed', content: ['Retrato de estúdio. Terno cinza, gravata vinho, sorriso ensaiado de quem vende confiança. No verso, a lápis: “T., outubro de 1991”.'] },
  { id: 'doc_agenda', title: 'Agenda de Thomas Reed (trechos)', content: ['16/11 — 9h Merrill (revisão trimestral). 13h almoço V. (Le Cirque — cancelar?)', '17/11 — Auditoria H.H. — pedir extratos de 89 a 91.', '18/11 — Não atender R. Dormir em casa.', '19/11 — Cópias. Cofre? Não. Lugar melhor.', '[Páginas de 20/11 em diante arrancadas.]'] },
  { id: 'doc_decalque', title: 'Decalque da página arrancada', content: ['“20/11 — 23h — R.W. — Ludlow. Levar as cópias.”'] },
  { id: 'doc_fita', title: 'Fita da secretária eletrônica (transcrição)', content: ['1 — Sáb. 21/11: “Thomas, sou eu. Me liga. Por favor.” (voz feminina)', '2 — Sex. 20/11, 21h12: “Reed, os números não fecham e você sabe disso. Não leve aquilo a ninguém antes de falar comigo. Ninguém.” (voz masculina, sotaque de Long Island)', '3 — Ter. 24/11, 3h04: silêncio, respiração lenta, som de gotas sobre metal. Clique.'] },
  { id: 'doc_halcyon', title: 'Transferências da Halcyon Holdings', content: ['Fotocópias de ordens de transferência, março de 1989 a outubro de 1992.', 'Origem: Halcyon Holdings Ltd. Destino: contas numeradas, Grand Cayman.', 'Assinatura autorizada em todas as ordens: R. Whitmore.', 'Na margem de uma delas, à caneta, a letra de Thomas: “Não é lavagem. É pagamento. A quem?”'] },
  { id: 'doc_bilhete', title: 'Bilhete amassado', content: ['“Ludlow 1ª porta de serviço. Qui 2h. Dizer que vem da parte do Sr. M.”'] },
];

export const REED_OBJECTIVES: ObjectiveDef[] = [
  { id: 'obj_ouvir_cliente', caseId: 'caso_reed', text: 'Receber a cliente que marcou hora para o fim da tarde.' },
  { id: 'obj_decidir', caseId: 'caso_reed', text: 'Decidir se aceita o caso da cliente.' },
  { id: 'obj_encontrar_thomas', caseId: 'caso_reed', text: 'Descobrir o que aconteceu com Thomas Reed.' },
  { id: 'obj_apartamento', caseId: 'caso_reed', text: 'Investigar o apartamento de Thomas Reed, na Rua 78 Leste.' },
  { id: 'obj_nocturne', caseId: 'caso_reed', text: 'Descobrir o que é o Nocturne, na Ludlow Street.' },
];
