/**
 * Onde cada protagonista está no início e o que acontece quando o grupo o
 * chama por telefone (PROPOSTO, refinável pelo criador — P-47).
 */
import type { CharacterId } from '../../engine/types';
import type { CallScript } from '../../engine/narrative/types';

export const CALL_SCRIPTS: Record<CharacterId, CallScript> = {
  jack: {
    whereabouts: 'Paradeiro incerto (dívidas)',
    arrivalMinutes: 50,
    call: [{ text: 'O telefone de Jack toca até cair na secretária. Na terceira tentativa, ele atende com a voz de quem não dorme há dias. — Tô ouvindo. Fala rápido.' }],
    arrival: [{ text: 'Quase uma hora depois, Jack Sullivan aparece na porta, a barba por fazer e o olhar desconfiado de quem conta os credores pelas janelas.' }],
  },
  daniel: {
    whereabouts: 'Plantão no Bellevue',
    arrivalMinutes: 40,
    call: [
      { text: 'A telefonista do Bellevue demora a encontrar Daniel Mercer. Quando ele atende, a voz é de fim de plantão.' },
      { text: '— Estranho você ligar hoje. — Uma pausa longa. — Perdi um paciente de madrugada. Perda de sangue que os ferimentos não explicam. Duas perfurações pequenas perto do pescoço. E o prontuário sumiu do arquivo depois que um homem de terno escuro apareceu pedindo por ele.', speaker: 'Daniel' },
    ],
    arrival: [{ text: 'Quarenta minutos depois, Daniel sobe as escadas com o jaleco ainda por baixo do casaco e olheiras de trinta horas.' }],
    effects: [
      { type: 'clue', id: 'prontuario_desaparecido' },
      { type: 'case', id: 'caso_bellevue', status: 'aguardando' },
      { type: 'objective', id: 'obj_bellevue', status: 'ativo' },
    ],
  },
  mick: {
    whereabouts: 'Turno de segurança em Midtown',
    arrivalMinutes: 30,
    call: [{ text: 'Mick Donovan atende no primeiro toque, como sempre. Ouve sem interromper. — Saio às sete. Chego em meia hora. Não abram a porta pra ninguém até lá.', speaker: 'Mick' }],
    arrival: [{ text: 'Meia hora depois, Mick entra, olha as duas saídas do escritório antes de olhar para qualquer pessoa, e só então tira as luvas.' }],
  },
  liz: {
    whereabouts: 'Redação do Village Voice',
    arrivalMinutes: 35,
    call: [
      { text: 'Na redação do Village Voice, alguém grita o nome de Liz por cima das máquinas de escrever.' },
      { text: '— Uma mulher rica procurando um consultor financeiro sumido? — Ela ri baixo. — Engraçado. Tem gente sumindo nessa cidade e ninguém quer escrever sobre isso. Estou indo.', speaker: 'Liz' },
    ],
    arrival: [{ text: 'Liz Morgan chega com a pasta de recortes debaixo do braço e o cheiro de cigarro da redação ainda no casaco.' }],
    effects: [
      { type: 'case', id: 'caso_voice', status: 'aguardando' },
      { type: 'objective', id: 'obj_voice', status: 'ativo' },
    ],
  },
  maggie: {
    whereabouts: 'Livraria de obras raras, Greenwich Village',
    arrivalMinutes: 40,
    call: [{ text: 'Maggie Holloway atende na livraria, entre o barulho de caixas de livros sendo abertas. — Se for algo antigo ou estranho, eu ajudo. Se for só perigoso, chame outra pessoa. — Uma pausa. — Estou indo mesmo assim.', speaker: 'Maggie' }],
    arrival: [{ text: 'Maggie chega com um livro debaixo do braço, que não abre, e observa o escritório como quem lê uma página difícil.' }],
  },
  ray: {
    whereabouts: 'Serviço de fechaduras no Upper West Side',
    arrivalMinutes: 35,
    call: [{ text: 'Ray Vega atende de um orelhão, com o barulho do tráfego ao fundo. — Fechadura nova no seu escritório e já tem cliente estranha? — Ele ri. — Me dá meia hora.', speaker: 'Ray' }],
    arrival: [{ text: 'Ray entra sem bater. Já sabia que a porta estava destrancada antes de tocar na maçaneta.' }],
  },
};
