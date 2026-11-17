/**
 * Onde cada protagonista está no início e como o grupo o chama
 * (PROPOSTO, refinável — P-47).
 *
 * Só é possível telefonar para quem algum protagonista presente conhece
 * (relações da seção 21). As ligações são curtas e não explicam nada:
 * cada um traz o que viveu em sua própria cena “Enquanto isso”.
 * {chamador} = quem faz a ligação.
 */
import type { CharacterId } from '../../engine/types';
import type { CallScript } from '../../engine/narrative/types';

export const CALL_SCRIPTS: Record<CharacterId, CallScript> = {
  jack: {
    whereabouts: 'Paradeiro incerto (dívidas)',
    arrivalMinutes: 50,
    call: [
      { text: 'O telefone de Jack toca até cair na secretária. Na terceira tentativa, ele atende.' },
      { text: '— Quem é. — Não é uma pergunta.', speaker: 'Jack' },
    ],
    arrival: [{ text: 'Quase uma hora depois, Jack Sullivan aparece na porta, a barba por fazer, olhando a rua pela janela antes de olhar para alguém.' }],
  },
  daniel: {
    whereabouts: 'Plantão no Bellevue',
    arrivalMinutes: 40,
    call: [
      { text: '{chamador} liga para a casa de Daniel. Ele atende no quinto toque.' },
      { text: '— Desculpa. Saí de um plantão de trinta horas. — Ele ouve sem interromper. — Eu vou. Preciso mesmo pensar em outra coisa.', speaker: 'Daniel' },
    ],
    arrival: [{ text: 'Daniel chega quarenta minutos depois, o casaco por cima da roupa do hospital. Cumprimenta todos e não diz mais nada por um bom tempo.' }],
  },
  mick: {
    whereabouts: 'Turno de segurança em Midtown',
    arrivalMinutes: 30,
    call: [
      { text: '{chamador} liga para Mick.' },
      { text: '— Saio às sete. Meia hora. — Uma pausa. — Não abram a porta pra ninguém até eu chegar.', speaker: 'Mick' },
    ],
    arrival: [{ text: 'Meia hora depois, Mick entra, olha as duas saídas antes de olhar para qualquer pessoa, e só então tira as luvas.' }],
  },
  liz: {
    whereabouts: 'Redação do Village Voice',
    arrivalMinutes: 35,
    call: [
      { text: '{chamador} liga para a redação do Village Voice. Alguém grita o nome de Liz por cima das máquinas de escrever.' },
      { text: '— Você só me liga quando precisa de alguma coisa. — Um suspiro. — Estou indo.', speaker: 'Liz' },
    ],
    arrival: [{ text: 'Liz Morgan chega com o casaco molhado e o bloco de notas apertado debaixo do braço, como se alguém pudesse tirá-lo dela.' }],
  },
  maggie: {
    whereabouts: 'Livraria de obras raras, Greenwich Village',
    arrivalMinutes: 40,
    call: [
      { text: '{chamador} liga para a livraria onde Maggie trabalha até tarde.' },
      { text: '— Se for algo antigo ou estranho, eu ajudo. Se for só perigoso, chame outra pessoa. — Silêncio. — Estou indo mesmo assim.', speaker: 'Maggie' },
    ],
    arrival: [{ text: 'Maggie chega com um livro debaixo do braço, que não abre, e observa o escritório como quem lê uma página difícil.' }],
  },
  ray: {
    whereabouts: 'Serviço de fechaduras no Upper West Side',
    arrivalMinutes: 35,
    call: [
      { text: '{chamador} deixa recado no pager de Ray. Dez minutos depois, ele retorna de um orelhão.' },
      { text: '— Hoje? Hoje custa o dobro. — Barulho de trânsito. — Meia hora.', speaker: 'Ray' },
    ],
    arrival: [{ text: 'Ray entra sem bater. Já sabia que a porta estava destrancada antes de tocar na maçaneta.' }],
  },
};
