/**
 * Roteiros de improviso (PROPOSTOS, refináveis — P-48).
 *
 * O que o narrador-IA pode usar para improvisar sem sair da história:
 * o que existe em cada cena, como cada NPC fala, o que sabe e aceita
 * contar, o que evita. Nada aqui contém segredos da conspiração: estes
 * textos podem ser enviados ao modelo.
 */
import type { NpcBrief, SceneBrief } from '../../engine/narrative/types';

export const SCENE_BRIEFS: Record<string, SceneBrief> = {
  escritorio: {
    ambiente: 'Escritório pequeno e decadente de um investigador particular, quarto andar de um prédio velho na Rua 46 Oeste, Midtown. Fim de tarde de 1º de dezembro de 1992, já escuro e frio lá fora.',
    objetos: [
      'mesa de madeira coberta de contas atrasadas e envelopes fechados',
      'o Daily News do dia, dobrado',
      'gaveta da escrivaninha',
      'telefone de disco preto',
      'aquecedor de ferro que estala',
      'persianas que deixam passar o neon da rua',
      'arquivo de aço com pastas de casos antigos sem relação com Thomas Reed',
      'cinzeiro cheio, cabide, uma garrafa de bourbon barato',
    ],
  },
  portaria: {
    ambiente: 'Saguão de um prédio residencial de antes da guerra na Rua 78 Leste, Upper East Side, à noite. Mármore gasto, espelho dourado, elevador de portas de latão.',
    objetos: [
      'o balcão do porteiro, com uma pequena TV mostrando um jogo dos Knicks',
      'livro de visitantes, que Sal não deixa ninguém folhear e que não registra nada útil sobre Thomas',
      'caixas de correio de latão',
      'porta de vidro para a rua, com toldo verde',
    ],
  },
  apartamento: {
    ambiente: 'Apartamento 5C de Thomas Reed, frio, cheirando a água sanitária, revirado por alguém que procurava papéis. Luz do poste entrando pelas janelas altas.',
    objetos: [
      'sala revirada: gavetas no chão, almofadas cortadas, livros fora da estante',
      'um Rolex de ouro intocado na mesa de centro',
      'escrivaninha de mogno',
      'secretária eletrônica com a luz piscando',
      'banheiro limpo demais',
      'sobretudo de cashmere no cabide ao lado da porta',
      'janela para a rua',
      'cozinha: louça seca na pia, comida estragada na geladeira, nada mais',
      'quarto: cama feita, ternos caros no armário, nada fora do lugar',
    ],
  },
  invasao: {
    ambiente: 'O apartamento 5C e o corredor do quinto andar, com dois homens armados à porta. Tensão imediata.',
    objetos: ['a porta do apartamento', 'o corredor mal iluminado', 'a janela que dá para a escada de incêndio'],
  },
  rua: {
    ambiente: 'Calçada da Rua 78 Leste à noite, vapor subindo dos bueiros, táxis passando, frio cortante.',
    objetos: ['um orelhão na esquina da Lexington', 'a entrada do prédio de Thomas', 'carros estacionados'],
  },
  fim_capitulo: {
    ambiente: 'O escritório de Midtown de madrugada: café requentado, o abajur aceso, as pistas espalhadas sobre a mesa.',
    objetos: ['as pistas reunidas até agora', 'o telefone', 'o sofá gasto', 'a janela com a cidade acordada lá fora'],
  },
};

export const NPC_BRIEFS: Record<string, NpcBrief> = {
  victoria: {
    persona: 'Mulher elegante, de idade difícil de precisar, vestida de vermelho, óculos escuros mesmo à noite, luvas. Rica, contida, acostumada a ser obedecida.',
    estilo: 'Frases curtas, educadas e frias. Nunca eleva a voz. Responde a perguntas pessoais com outra pergunta ou com silêncio. Fala de Thomas às vezes no passado.',
    sabe: [
      'Thomas Reed tem 38 anos, é consultor financeiro e desapareceu há onze dias.',
      'Thomas é seu amante há cerca de dois anos e nunca passou um dia sem telefonar para ela.',
      'Acredita que Thomas está morto e diz sentir isso.',
      'O marido é rico, influente e tem amigos na polícia; por isso ela não procurou a polícia.',
      'O marido empresta dinheiro a homens desesperados; ela sabe da dívida de Jack Sullivan.',
      'Oferece dois milhões de dólares: metade quando souber o que aconteceu, metade quando tiver certeza.',
      'Thomas morava na Rua 78 Leste, nº 211, apartamento 5C; o porteiro se chama Sal.',
    ],
    evita: [
      'onde mora e detalhes da própria vida',
      'por que usa óculos escuros à noite',
      'como soube de Jack Sullivan',
      'em que Thomas estava trabalhando (diz que não entende de números)',
    ],
    naoSabe: ['quem revirou o apartamento', 'o que é o Nocturne', 'o paradeiro atual de Thomas'],
  },
  sal: {
    persona: 'Sal Benedetto, porteiro de uns sessenta anos, uniforme de botões dourados, torcedor dos Knicks, cansado e decente.',
    estilo: 'Fala do jeito do Brooklyn, informal, desconfiado de estranhos, amolece com educação e com a fotografia de Thomas. Não gosta de encrenca.',
    sabe: [
      'Thomas Reed era educado e dava boa gorjeta no Natal.',
      'Faz uns dez ou onze dias que não vê Thomas; achou que ele tinha viajado.',
      'Uma mulher bem vestida às vezes visitava Thomas, mas Sal não comenta a vida dos moradores.',
    ],
    evita: [
      'os dois homens “da seguradora” que subiram ao 5C três noites atrás: só conta isso se for convencido ou pressionado pelas ações próprias de persuasão ou interrogatório; nunca revele de outra forma',
      'deixar alguém subir sem chave ou autorização',
    ],
    naoSabe: ['para onde Thomas foi', 'quem eram de fato os homens', 'o que havia na caixa que levaram'],
  },
  invasores: {
    persona: 'Dois criminosos de rua de vinte e poucos anos, jaquetas de couro, nervosos; um com faca no cinto, outro com a mão escondida na jaqueta.',
    estilo: 'Gíria de rua, ameaças curtas, impaciência. Não negociam por muito tempo.',
    sabe: ['Foram mandados procurar algo no apartamento.'],
    evita: ['quem os mandou e o que procuram — isso só aparece pelas ações próprias de se esconder, encarar ou revistá-los'],
    naoSabe: ['quem é o grupo'],
  },
};
