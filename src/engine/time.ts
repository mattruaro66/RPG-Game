// Calendário interno. Tempo = minutos desde 1º/12/1992 00:00.

const START_UTC = Date.UTC(1992, 11, 1, 0, 0, 0);

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function toDate(minutes: number): Date {
  return new Date(START_UTC + minutes * 60_000);
}

/** Índice do dia (0 = 1º de dezembro de 1992). */
export function dayIndex(minutes: number): number {
  return Math.floor(minutes / 1440);
}

export function hourOf(minutes: number): number {
  return Math.floor((minutes % 1440) / 60);
}

export function formatClock(minutes: number): string {
  const d = toDate(minutes);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export function formatDate(minutes: number): string {
  const d = toDate(minutes);
  const day = d.getUTCDate();
  return `${WEEKDAYS[d.getUTCDay()]}, ${day === 1 ? '1º' : day} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

export function formatDateTime(minutes: number): string {
  return `${formatDate(minutes)} — ${formatClock(minutes)}`;
}

export type Period = 'madrugada' | 'manha' | 'tarde' | 'noite';

export function periodOf(minutes: number): Period {
  const h = hourOf(minutes);
  if (h < 6) return 'madrugada';
  if (h < 12) return 'manha';
  if (h < 17) return 'tarde';
  return 'noite';
}

/** Minutos até a próxima ocorrência de uma hora do dia. */
export function minutesUntilHour(minutes: number, hour: number): number {
  const cur = minutes % 1440;
  const target = hour * 60;
  return target > cur ? target - cur : 1440 - cur + target;
}
