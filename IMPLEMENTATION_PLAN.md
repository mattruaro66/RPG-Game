# Plano de implementação

## Arquitetura

Aplicação web local: **TypeScript + React 18 + Vite**, testes com **Vitest**. Sem servidor; salvamento em `localStorage`.

```
src/
  config/rules.ts        Parâmetros CANÔNICOS e PROVISÓRIOS (P-xx), isolados
  engine/                Motor de regras puro (sem React)
    types.ts             Tipos centrais
    dice/dice.ts         RNG serializável (mulberry32), D6/D20, dados fixos para testes
    checks.ts            Testes D6/D20, limites, críticos, Teimosia, descrição para o registro
    bonuses.ts           Resolução de bônus/ônus por etiquetas de contexto
    character.ts         Limites a partir da ficha + etiquetas derivadas (paranoia)
    damage.ts            Tabela de dano, aplicação de dano, letalidade sobrenatural
    sanity.ts            Estados, eventos de horror, recuperação diária, Psiquiatria
    medical.ts           Tratamentos
    inventory.ts         Mãos / bolsa / bolsos
    progression.ts       XP e melhorias
    time.ts              Calendário de 1992
    party.ts             Criação e validação do grupo
    combat/              Iniciativa, fila, cooperação, ações de combate
    narrative/           Cenas, diálogos, condições, efeitos, facções, validação de conteúdo
    state.ts             GameState serializável (camadas do jogador e interna)
  data/                  Conteúdo (personagens, especialidades, bônus, itens, inimigos)
    campaign/            Prólogo, caso Reed, casos-gancho, camada interna, registro
  ai/                    IA dos companheiros/inimigos, narrador local e interpretador de respostas livres
  platform/              Recursos do artefato (Claude, voz, ditado, imagens), todos opcionais
  state/                 session.ts (ações puras estado→estado) e GameContext (React)
  persistence/           Salvamento versionado, slots, configurações
  screens/, components/  Interface
  styles/                Direção de arte
  tests/                 Testes automatizados
```

Princípios: a lógica de jogo não conhece a interface; o conteúdo narrativo é dado, não código; o motor carrega o conteúdo por um registro (`registerCampaign`), então novas campanhas/capítulos entram sem reescrever o motor. Toda rolagem usa o RNG guardado no próprio estado — salvar e carregar reproduz exatamente as próximas rolagens.

## Fases

### Fase 1 — Fundação ✅
- [x] Projeto executável (Vite + React + TS)
- [x] Interface principal (menu com as 6 opções)
- [x] Seis personagens com atributos canônicos
- [x] Seleção de 4 personagens, 3 especialidades e 2 bônus cada, controle Jogador/IA
- [x] Fichas completas
- [x] Sistema de dados (D6, D20, críticos, bônus/ônus, Teimosia)
- [x] Salvamento (automático + 3 arquivos, versionado)

### Fase 2 — Mecânicas ✅ (com itens provisórios)
- [x] PV e Às Portas da Morte
- [x] Sanidade, eventos de horror, recuperação diária, Psiquiatria
- [x] Inventário (mãos/bolsa/bolsos, mover, transferir, descartar, pegar do local)
- [x] Iniciativa com desempate
- [x] Combate básico por turnos (atacar, defender, cobertura, cooperar, item, tratar, ambiente, fugir)
- [x] Cooperação com fila de iniciativa
- [x] Tratamento médico (em combate e fora)
- [x] XP (contagem; gasto pendente — P-16)
- [x] Diário de investigação

### Fase 3 — Narrativa ✅
- [x] Prólogo canônico
- [x] Primeira cena investigativa
- [x] Diálogos interativos com testes
- [x] Objetos examináveis
- [x] Pistas com importância, relações, extras e Memória Fotográfica
- [x] Decisões persistentes (flags, confiança de NPCs, decisões registradas)
- [x] Calendário integrado (tempo por ação, descanso, deriva diária da conspiração)

### Fase 4 — Protótipo de campanha ✅
Capítulo “O desaparecimento de Thomas Reed”: escritório → portaria → apartamento 5C → visitantes (combate opcional/evitável) → rua → encerramento provisório.
- [x] Locais exploráveis, NPCs (Victoria, Sal), evidências, testes, escolhas com consequências
- [x] Prosseguir após falhas (caminhos sem dados para todas as pistas essenciais — verificado por teste)
- [x] Adaptação à composição do grupo (sem Jack, sem Ray etc.)
- [x] Encerramento provisório com ganchos para Bellevue e Village Voice

### Fase 5 — Imersão ✅
- [x] Resposta livre: o jogador escreve (ou dita) o que o personagem diz ou faz; o Claude interpreta dentro das ações disponíveis; interpretador local como alternativa
- [x] Narração e diálogos falados (vozes do Claude em pt-BR, uma por personagem; voz do navegador como alternativa)
- [x] Fotos: catálogo de 28 vagas (locais, NPCs, protagonistas, objetos), fotos de acervo com crédito, envio de imagens pela Galeria, tratamento noir automático
- [x] `IMAGE_PROMPTS.md` com prompts prontos para gerar as imagens que faltam

## Próximas etapas (ordem sugerida)

1. **Revisão do criador** de `PENDING_DECISIONS.md` (especialmente P-02, P-06, P-11/12/13, P-16, P-24, P-27 e P-31).
2. **Capítulo 2 — Bellevue** (Daniel/Mick): pronto-socorro, arquivo, o homem de terno escuro. Precisa de roteiro (P-41).
3. **Capítulo 3 — Village Voice** (Liz/Maggie): redação, funerária fechada, pressão editorial.
4. **Nocturne**: ponto de convergência proposto das três linhas.
5. **Reações de antagonistas** dirigidas pelos estados da conspiração (eventos que disparam por limiar e tempo).
6. **Progressão**: tela de gasto de melhorias assim que P-16 for decidido.
7. **Narrador LLM ampliado** (P-26): falas inéditas de NPCs e improviso de cenas, sempre sem efeitos mecânicos.
8. **Disciplinas** e regras sobrenaturais quando especificadas.
9. Gerar e enviar as imagens pendentes (P-46); trilha e sons ambientes.

## Verificações disponíveis

```bash
npm test          # testes automatizados (Vitest)
npm run typecheck # TypeScript estrito
npm run build     # build de produção
```
