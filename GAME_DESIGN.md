# Nova Iorque: 1992 — Documento de Design (decisões canônicas)

Este documento registra **somente o que foi estabelecido pelo criador** (classificação **CANÔNICO**).
Soluções técnicas provisórias e lacunas estão em [`PENDING_DECISIONS.md`](PENDING_DECISIONS.md).
O código cita cada parâmetro provisório pelo código `P-xx`.

| Classificação | Significado |
|---|---|
| **CANÔNICO** | Estabelecido pelo criador. Não pode ser alterado pelo desenvolvimento. |
| **PROVISÓRIO** | Solução técnica para o protótipo funcionar. Reversível, isolada em `src/config/rules.ts` ou em dados. |
| **PENDENTE** | Decisão de design que exige aprovação. |

---

## 1. Conceito

- **Gênero:** RPG narrativo, investigação, horror psicológico e conspiração sobrenatural.
- **Ambientação:** Nova Iorque, a partir de 1º de dezembro de 1992 (terça-feira).
- **Perspectiva:** um jogador controla um grupo de até quatro protagonistas humanos. Personagens não controlados pelo jogador são controlados por IA de acordo com sua personalidade; em jogo solo, a IA atua como narrador.
- **Estilo:** horror urbano, noir, gótico contemporâneo, suspense policial. Interface sem fantasia medieval.
- Todos os textos narrativos em português brasileiro.

### Princípios narrativos
Não há protagonista invencível nem caminho obrigatório; o mundo segue funcionando; antagonistas têm planos próprios; nem todo vampiro é inimigo e nem todo humano é aliado; informação é ferramenta de sobrevivência; violência tem consequências; investigação vale mais que combate; erros podem ser permanentes.

## 2. Estrutura da experiência

- Menu: Novo Jogo, Continuar, Carregar Jogo, Personagens, Regras, Configurações.
- Novo jogo: introdução → escolher 4 de 6 personagens (sem repetição) → 3 especialidades e 2 bônus por personagem → confirmar → campanha. Atributos fixos por profissão; sem distribuição livre de pontos.
- Campanha por cenas conectadas por decisões, evidências, personagens e acontecimentos; não depende de uma árvore linear.

## 3. Atributos

Físico, Reflexo, Raciocínio, Presença, Espírito. Escala 0–5 (0 = incapaz; 1 ruim; 2 comum; 3 boa; 4 treinada; 5 excepcional). 13 pontos por personagem.

| Profissão | Físico | Reflexo | Raciocínio | Presença | Espírito |
|---|---:|---:|---:|---:|---:|
| Investigador | 2 | 2 | 5 | 2 | 2 |
| Médico | 2 | 2 | 4 | 2 | 3 |
| Operativo | 4 | 4 | 2 | 1 | 2 |
| Jornalista | 1 | 2 | 3 | 5 | 2 |
| Ocultista | 1 | 2 | 4 | 2 | 4 |
| Infiltrador | 2 | 4 | 3 | 3 | 1 |

## 4. Elenco

| Personagem | Profissão | Idade | Status da biografia |
|---|---|---|---|
| Jack Sullivan | Investigador | 42 | Canônico (escritório em Midtown, dificuldades financeiras, caso Thomas Reed) |
| Daniel Mercer | Médico | 36 | Canônico (Bellevue, paciente com perda sanguínea inexplicável, prontuário desaparecido) |
| Michael “Mick” Donovan | Operativo | 38 | Contexto proposto |
| Elizabeth “Liz” Morgan | Jornalista | 31 | Canônico (The Village Voice, corpos não identificados) |
| Margaret “Maggie” Holloway | Ocultista | 32 | Contexto proposto |
| Raymond “Ray” Vega | Infiltrador | 34 | Contexto proposto |

Nomes, profissões e atributos são fixos nesta versão. Relações propostas: Daniel↔Mick; Liz↔Jack, Maggie; Jack↔Liz, Ray; Mick↔Daniel, Ray; Maggie↔Liz, Ray; Ray↔Jack, Mick, Maggie.

## 5. Especialidades

8 por profissão (48 no total), exatamente 3 escolhidas por personagem na criação. Lista completa em `src/data/specialties.ts`. **Infiltração não é subdividida.** Qualquer personagem pode aprender especialidades de outras profissões pela progressão.

## 6. Sistema de dados

### D6 — teste simples
Sucesso se resultado ≤ atributo. **6 natural sempre falha.**

### D20 — teste de ação
| Situação | Limite |
|---|---|
| Sem especialidade | atributo |
| Com especialidade | atributo + 10 |
| Com especialidade e bônus aplicável | atributo + 15 |
| Com especialidade sob ônus aplicável | atributo + 8 |

- **1 natural sempre falha.**
- Sem a especialidade, o personagem pode tentar usando apenas o atributo.
- Bônus e ônus não são cumulativos, não se sobrepõem e não se anulam; nunca se aplicam sem a especialidade.
- Atributo 0 impede ações que dependam dele.
- Não criar modificadores arbitrários.

### Crítico
Resultado do D20 exatamente igual ao limite aplicável, **exigindo a especialidade**. 1 natural continua sendo falha. Dano crítico **dobra o total** (1D6+2 com 6 → 8 → 16).

## 7. Bônus (20)

Permanentes, sem limite de uso, sujeitos às condições. Estrutura: ID, nome, descrição, condições de ativação, modificador positivo, condições de ônus, modificador negativo e regras especiais (`src/data/bonuses.ts`). A interface informa quando um bônus ou ônus é aplicado. Bônus sociais não se aplicam automaticamente a toda conversa.

Lista: Olho Clínico · Memória Fotográfica · Lábia · Presença Marcante (ônus) · Camaleão Social · Sangue Frio (ônus) · Mira Perfeita · Ágil · Resistente · Reflexos Instintivos · Improvisador · Leitor de Pessoas (ônus) · Instinto de Perigo (ônus, exceto em combate; o narrador pode sinalizar perigo sem revelar a origem) · Mente Estratégica (ônus) · Foco Absoluto · Sobrevivente (ônus fora de perigo real) · Teimosia Inabalável (repete o D20 uma vez por teste, segundo resultado obrigatório; ônus quando contradito) · Lutador Marcial · Mãos Habilidosas (ônus) · Ambidestro.

## 8. Pontos de Vida

20 PV para todos os protagonistas. PV > 0: funcional. **PV = 0: Às Portas da Morte** — não age normalmente; **qualquer dano adicional causa a morte.** Não existem armaduras.

| Tipo | Dano |
|---|---|
| Desarmado | 1D6 − 2 |
| Arma improvisada ou impacto leve | 1D6 − 1 |
| Arma de impacto ou corte | 1D6 |
| Arma de fogo | 1D6 + 2 |
| Ataque vampírico pesado | 2D6 |
| Ataque vampírico excepcional | 2D6 + 2 |

A política de dano mínimo para resultados negativos é **configurável** até aprovação.

## 9. Combate por turnos

- Iniciativa: D6; maior age primeiro. Empate: nova rolagem; persistindo, o narrador decide.
- Especialidade pertinente: +2. Operativo em combate: +1 automático. Acumuláveis. O Infiltrador não recebe bônus automático.
- Ações suportadas: atacar, defender/esquivar, procurar cobertura, cooperar, utilizar item, atendimento médico, interagir com o ambiente, fugir.
- **Cobertura** consome o turno; seus testes ocorrem antes dos de defesa/esquiva; resolução separada da lógica de ataque.
- **Cooperação** fora da posição na iniciativa: teste simples de Reflexo (D6). Sucesso: coopera e mantém o turno. Falha: não coopera e vai para o fim da fila, sem alterar a ordem relativa dos demais. Um ou dois ajudantes; os quatro nunca agem simultaneamente. O D6 verifica a cooperação; o D20 resolve a ação. Em investigação, o resultado pode determinar qualidade ou relevância de informações adicionais. Sem bônus arbitrários.

## 10. Letalidade dos vampiros

Balas comuns causam dano básico mas não matam vampiros. Um crítico com arma de fogo pode matar um humano ou ghoul; dois críticos podem matar um vampiro comum; três, um vampiro-mestre. Regras separadas do cálculo de PV; zerar PV de um vampiro não implica destruí-lo.

## 11. Sistema médico

Primeiros Socorros, Medicina de Emergência e Cirurgia: 1D6+1 PV. Farmacologia: 1D6−1 PV. Medicina Legal não recupera PV. Tratamento consome um turno. O Médico pode tratar a si mesmo, mas não realizar procedimentos complexos em si. Máximo de 20 PV. Sem cura automática.

## 12. Sanidade

10 pontos iniciais. 8–10 São · 5–7 Paranoia · 2–4 Comprometimento psicológico (testes de Espírito para manter o foco) · 1 À beira do colapso · 0 Loucura irreversível (deixa de ser protagonista jogável; sem recuperação).

- Evidência estranha sem exposição direta: pode não causar perda. Horror humano: −1 mediante teste de Espírito. Manifestação sobrenatural presenciada: −1 automático. Tabela configurável.
- Recuperação: um teste de Espírito (D6) por dia; sucesso +1.
- **Psiquiatria** (Médico): não cai abaixo de 5; recupera 1 ponto de outro personagem uma vez ao dia, apenas com a própria Sanidade 8–10; com 7 ou menos perde temporariamente essa capacidade, mantendo a proteção pessoal.

## 13. Inventário

Duas mãos (2 espaços), bolsa/mochila (3 espaços), bolsos para objetos pequenos específicos (relógio, carteira, isqueiro, pequenos medicamentos, chaves). Munição, kits médicos e objetos grandes não vão nos bolsos. Ações: examinar, equipar, guardar, transferir, utilizar, descartar. Não há mochila adicional como item obrigatório.

## 14. Progressão

XP concedido pelo narrador. A cada 20 XP, uma melhoria de +1. Qualquer personagem pode aprender especialidades de outras profissões. Sem tabela extensa de níveis.

## 15. Inimigos humanos e criaturas

- **Criminoso comum:** sem especialidades por padrão (alguns com Armas Curtas ou Combate Corpo a Corpo); +1 em Físico/Reflexo em combate; +1 em Reflexo em grupo de 2+; não acumulam no mesmo teste.
- **Capanga profissional:** +1 em Físico em corpo a corpo; não abandona voluntariamente o combate.
- **Fanático de culto:** níveis superiores com resistência psicológica excepcional; alguns líderes com capacidades necromânticas.
- **Morto reanimado:** Físico 2, Reflexo 2, PV 6; sem resistência psicológica ou vontade própria convencional.

## 16. Sociedade sobrenatural

Máscara; Camarilla (não unificada, com conflitos internos); suporte narrativo para Ventrue, Toreador, Tremere, Nosferatu, Brujah, Malkavian, Gangrel, linhagens necromânticas precursoras dos Hecata, Sangues-Ralos/Duskborn e Ghouls. Arquitetura preparada para disciplinas (ex.: Auspícios, Fortitude, Oblívio) sem valores numéricos ainda. Referências de ambientação de Vampire: The Masquerade são separadas do conteúdo autoral.

**Cronologia:** em 1992, a facção necromântica é tratada como articulação precursora (os Hecata oficiais são posteriores), salvo autorização de cronologia alternativa.

## 17. Conspiração central (camada interna)

Facção necromântica + grupos de Sangues-Ralos. Os Sangues-Ralos querem sair da condição inferior (alguns via diablerie); os necromantes querem acumular mortes e corpos para um ritual de grande escala que traria entidades demoníacas e lhes daria domínio sobre a morte. Os Sangues-Ralos são força de choque; a Camarilla inicialmente não liga os eventos; os necromantes querem escalada de conflito. Limitações: não conhecem todas as forças, subestimam antigos, nem todos os membros participam.

Estados de progressão rastreados: atividade dos Sangues-Ralos, investigação da Camarilla, avanço dos necromantes, exposição da Máscara, risco para os protagonistas, preparação do ritual. **Não há número definitivo de vítimas, artefatos, locais ou condições de vitória.**

## 18. Abertura e investigações iniciais

- **Prólogo:** texto aprovado, preservado integralmente (`src/data/campaign/prologue.ts`).
- **O paciente do Bellevue** (Daniel; Mick pode integrar).
- **Os corpos sem identificação** (Liz; Maggie pode ajudar).
- **O desaparecimento de Thomas Reed** (Jack; Ray pode integrar): Victoria Whitmore (roupas vermelhas extravagantes, óculos escuros, sobretudo vermelho), Thomas Reed (38, consultor financeiro, desaparecido há 11 dias, amante de Victoria, que o acredita morto), Richard Whitmore (influência, amigos na polícia), dívida de Jack de US$ 300 mil com Richard, oferta de US$ 2 milhões. **O diálogo sobre a polícia é preservado integralmente.**

A campanha não pode ficar impossível pela ausência de um personagem: deve haver acesso narrativo alternativo às pistas essenciais, sem conceder as vantagens da especialidade.

## 19. Investigação

Pistas com identificador, descrição, local, personagens, condições de acesso, importância, relações, informações adicionais e consequências. **Pistas essenciais não dependem exclusivamente de sucesso em dados**; testes alteram quantidade, tempo, qualidade, exposição, atenção e recursos. Diário com casos, pistas, pessoas, locais, documentos, hipóteses, eventos e objetivos. A interface pode mostrar conexões, mas não resolve o mistério.

## 20. Ambientação histórica

Tecnologia de 1992: telefones fixos e públicos, pagers, câmeras analógicas, gravadores de fita, jornais, arquivos físicos, microfilmes, computadores limitados; celulares caros e raros. Sem smartphones, redes sociais, GPS ou busca instantânea. Informação exige tempo, contatos, deslocamento ou acesso institucional.

## 21. NPCs, tempo e consequências

- NPCs relevantes têm nome, papel, local, objetivos, conhecimento, relações, segredos, recursos, confiança, estado e reações; não sabem o que não puderam descobrir.
- Calendário e relógio internos; tempo passa com deslocamentos, investigações, tratamentos, descanso, esperas e eventos. Recuperação diária de Sanidade e progresso dos antagonistas dependem dele. Sem prazo definitivo para o ritual.
- Estado persistente e serializável: personagens vivos, PV, Sanidade, especialidades, bônus, XP, inventário, pistas, relacionamentos, missões, locais, decisões, conhecimento sobre vampiros, atenção de facções, avanço da conspiração, exposição da Máscara.

## 22. Separação de camadas

- **Camada do jogador:** pistas, documentos, pessoas, hipóteses, objetivos, histórico de decisões.
- **Camada interna:** antagonistas, planos ocultos, alianças, motivações reais, cronologia, reações de facções, informações não descobertas, condições futuras.

Nada da camada interna aparece em diálogos, diários ou interfaces do jogador antes da descoberta. No protótipo ela fica em `src/data/campaign/internal.ts` e em `GameState.internal`, visíveis apenas no **Modo Mestre** (opcional, para mestre humano).

## 23. Direção visual

Noir, horror urbano, NY anos 1990. Preto, cinza, vinho escuro e tons envelhecidos. Tipografia legível. Elementos de arquivos policiais, jornais, fotografias analógicas e documentos. Tela dividida em Narrativa, Ações, Grupo e Informações. Registro de rolagens visível, explicando falhas automáticas e críticos.
