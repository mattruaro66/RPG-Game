import type { AttributeId, ProfessionId } from '../engine/types';

export interface SpecialtyDef {
  id: string;
  name: string;
  profession: ProfessionId;
  description: string;
  /**
   * Atributo sugerido apenas para exibição. O atributo de cada teste é
   * definido pela ação (cena/combate), não pela especialidade. (P-22)
   */
  suggestedAttribute: AttributeId;
}

const s = (
  profession: ProfessionId,
  id: string,
  name: string,
  suggestedAttribute: AttributeId,
  description: string,
): SpecialtyDef => ({ id, name, profession, description, suggestedAttribute });

// CANÔNICO: 8 especialidades por profissão, nomes e descrições conforme especificação.
export const SPECIALTIES: SpecialtyDef[] = [
  // Investigador
  s('investigador', 'criminologia', 'Criminologia', 'raciocinio', 'Conhecimento sobre crimes, padrões de atividade criminosa e métodos de investigação.'),
  s('investigador', 'deducao', 'Dedução', 'raciocinio', 'Relacionar evidências, identificar contradições e construir hipóteses.'),
  s('investigador', 'interrogatorio', 'Interrogatório', 'presenca', 'Obter informações por questionamentos estruturados.'),
  s('investigador', 'analise_comportamental', 'Análise Comportamental', 'raciocinio', 'Interpretar comportamentos, padrões e reações.'),
  s('investigador', 'investigacao_de_campo', 'Investigação de Campo', 'raciocinio', 'Examinar ambientes, procurar vestígios e reconstruir acontecimentos.'),
  s('investigador', 'pericia_documental', 'Perícia Documental', 'raciocinio', 'Analisar documentos, registros, assinaturas e possíveis adulterações.'),
  s('investigador', 'perfil_psicologico', 'Perfil Psicológico', 'raciocinio', 'Compreender motivações e padrões psicológicos.'),
  s('investigador', 'pesquisa_arquivamento', 'Pesquisa e Arquivamento', 'raciocinio', 'Localizar e cruzar informações em arquivos físicos e bases documentais.'),
  // Médico
  s('medico', 'primeiros_socorros', 'Primeiros Socorros', 'raciocinio', 'Atendimento imediato de ferimentos.'),
  s('medico', 'medicina_emergencia', 'Medicina de Emergência', 'raciocinio', 'Tratamento de situações médicas urgentes.'),
  s('medico', 'cirurgia', 'Cirurgia', 'raciocinio', 'Procedimentos cirúrgicos e tratamento de lesões complexas.'),
  s('medico', 'anatomia', 'Anatomia', 'raciocinio', 'Conhecimento detalhado do corpo humano.'),
  s('medico', 'medicina_legal', 'Medicina Legal', 'raciocinio', 'Interpretação médica de mortes, lesões e evidências.'),
  s('medico', 'toxicologia', 'Toxicologia', 'raciocinio', 'Identificação e compreensão de substâncias tóxicas.'),
  s('medico', 'farmacologia', 'Farmacologia', 'raciocinio', 'Conhecimento de medicamentos e seus efeitos.'),
  s('medico', 'psiquiatria', 'Psiquiatria', 'espirito', 'Avaliação e tratamento de condições psicológicas.'),
  // Operativo
  s('operativo', 'armas_curtas', 'Armas Curtas', 'reflexo', 'Utilização de armas de fogo curtas.'),
  s('operativo', 'armas_longas', 'Armas Longas', 'reflexo', 'Utilização de armas de fogo longas.'),
  s('operativo', 'combate_corpo_a_corpo', 'Combate Corpo a Corpo', 'fisico', 'Luta e enfrentamentos físicos.'),
  s('operativo', 'lideranca_tatica', 'Liderança Tática', 'raciocinio', 'Coordenação de ações em situações de risco.'),
  s('operativo', 'sobrevivencia', 'Sobrevivência', 'fisico', 'Adaptação a ambientes adversos.'),
  s('operativo', 'rastreamento', 'Rastreamento', 'raciocinio', 'Acompanhamento de vestígios e deslocamentos.'),
  s('operativo', 'conducao', 'Condução', 'reflexo', 'Controle de veículos em condições difíceis.'),
  s('operativo', 'seguranca_operacional', 'Segurança Operacional', 'raciocinio', 'Avaliação e organização de medidas de segurança.'),
  // Jornalista
  s('jornalista', 'fontes_contatos', 'Fontes e Contatos', 'presenca', 'Estabelecer e utilizar redes de informantes.'),
  s('jornalista', 'entrevistas', 'Entrevistas', 'presenca', 'Conduzir conversas para obter informações.'),
  s('jornalista', 'persuasao', 'Persuasão', 'presenca', 'Convencer pessoas por argumentação.'),
  s('jornalista', 'investigacao_jornalistica', 'Investigação Jornalística', 'raciocinio', 'Apurar acontecimentos e cruzar fontes.'),
  s('jornalista', 'politica', 'Política', 'raciocinio', 'Compreender estruturas e interesses políticos.'),
  s('jornalista', 'documentar', 'Documentar', 'raciocinio', 'Registrar acontecimentos e preservar informações.'),
  s('jornalista', 'infiltracao_social', 'Infiltração Social', 'presenca', 'Circular discretamente em ambientes sociais.'),
  s('jornalista', 'manipulacao', 'Manipulação', 'presenca', 'Influenciar percepções e comportamentos por meio da comunicação.'),
  // Ocultista
  s('ocultista', 'folclore', 'Folclore', 'raciocinio', 'Conhecer tradições e narrativas populares.'),
  s('ocultista', 'simbologia', 'Simbologia', 'raciocinio', 'Interpretar símbolos e representações.'),
  s('ocultista', 'religioes_crencas', 'Religiões e Crenças', 'raciocinio', 'Compreender tradições religiosas.'),
  s('ocultista', 'cultos_seitas', 'Cultos e Seitas', 'raciocinio', 'Reconhecer organizações religiosas ou esotéricas.'),
  s('ocultista', 'historia_oculta', 'História Oculta', 'raciocinio', 'Pesquisar acontecimentos ligados a tradições esotéricas.'),
  s('ocultista', 'rituais', 'Rituais', 'raciocinio', 'Compreender estruturas e significados de cerimônias.'),
  s('ocultista', 'artefatos', 'Artefatos', 'raciocinio', 'Identificar objetos de importância histórica ou ocultista.'),
  s('ocultista', 'mitologia_comparada', 'Mitologia Comparada', 'raciocinio', 'Relacionar mitos e tradições de diferentes culturas.'),
  // Infiltrador
  s('infiltrador', 'furtividade', 'Furtividade', 'reflexo', 'Agir sem chamar atenção.'),
  s('infiltrador', 'disfarces', 'Disfarces', 'presenca', 'Modificar a apresentação e a identidade aparente.'),
  s('infiltrador', 'arrombamento', 'Arrombamento', 'reflexo', 'Lidar com fechaduras e acessos físicos.'),
  s('infiltrador', 'falsificacao', 'Falsificação', 'raciocinio', 'Reconhecer e produzir representações documentais fictícias dentro do jogo.'),
  s('infiltrador', 'contrainteligencia', 'Contrainteligência', 'raciocinio', 'Identificar tentativas de vigilância e obtenção de informações.'),
  s('infiltrador', 'vigilancia', 'Vigilância', 'raciocinio', 'Observar pessoas e locais sem exposição desnecessária.'),
  s('infiltrador', 'evasao', 'Evasão', 'reflexo', 'Escapar de perseguições e situações de risco.'),
  // CANÔNICO: Infiltração não é subdividida.
  s('infiltrador', 'infiltracao', 'Infiltração', 'presenca', 'Acessar ambientes físicos, institucionais ou sociais sem autorização aparente.'),
];

export const SPECIALTY_BY_ID: Record<string, SpecialtyDef> = Object.fromEntries(
  SPECIALTIES.map((sp) => [sp.id, sp]),
);

export function specialtiesOf(profession: ProfessionId): SpecialtyDef[] {
  return SPECIALTIES.filter((sp) => sp.profession === profession);
}

export function specialtyName(id: string): string {
  return SPECIALTY_BY_ID[id]?.name ?? id;
}
