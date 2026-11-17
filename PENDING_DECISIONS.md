# Decisões pendentes

Lacunas de design encontradas durante a implementação. Cada item tem:

- **Status:** `PROVISÓRIO` (há uma solução técnica temporária, isolada e reversível) ou `PENDENTE` (nada foi implementado além do mínimo).
- **Onde:** arquivo/parâmetro onde a solução está isolada.
- **Pergunta:** o que o criador precisa decidir.

Nenhuma solução provisória deve ser tratada como regra definitiva.

---

## Regras de dados e modificadores

| Código | Status | Tema | Solução atual | Onde | Pergunta ao criador |
|---|---|---|---|---|---|
| P-01 | PROVISÓRIO | Dano mínimo com resultado negativo (ex.: desarmado 1D6−2 rolando 1) | Mínimo 0; configurável para 1 nas Configurações | `rules.minDamage` | O dano mínimo é 0 ou 1? |
| P-02 | PROVISÓRIO | Um bônus e um ônus **de bônus diferentes** disparam no mesmo teste | O ônus prevalece (+8); configurável: bônus prevalece (+15) ou só especialidade (+10) | `rules.bonusOnusConflict` | Qual prevalece? A regra “não se anulam” sugere que um dos dois vence. |
| P-15 | PROVISÓRIO | Teimosia Inabalável | Oferecida só após falha; em combate é usada automaticamente após falha | `rules.teimosiaOnlyOnFailure`, `rules.teimosiaAutoInCombat` | Pode repetir um sucesso (para buscar crítico)? Em combate deve sempre perguntar? |
| P-22 | PROVISÓRIO | Atributo de cada especialidade | O atributo é definido por cada ação; a especialidade tem só um atributo “sugerido” para exibição | `data/specialties.ts` | Cada especialidade tem atributo fixo, ou depende da ação? |
| P-23 | PROVISÓRIO | Tradução dos bônus para condições verificáveis | Etiquetas de contexto (`ContextTag`) por ação. Interpretações: ônus de Instinto de Perigo, Teimosia e Sangue Frio valem para **qualquer** especialidade quando a condição ocorre; ônus de Leitor de Pessoas, Mente Estratégica, Mãos Habilidosas e Sobrevivente só no domínio do próprio bônus | `data/bonuses.ts` | As interpretações estão corretas? |
| P-33 | PROVISÓRIO | Traços “+1” de inimigos em testes D20 | +1 também no limite do D20 (além do D6) | `combat.ts › enemyTraitModifier` | O +1 vale para D6 e D20? |
| P-40 | PROVISÓRIO | “Paranoia” no ônus de Mente Estratégica | Sanidade 5–7 gera automaticamente a condição `paranoia` | `engine/character.ts` | A faixa Paranoia da Sanidade aciona esse ônus? |

## Combate

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-03 | PROVISÓRIO | Empates persistentes na iniciativa | Até 3 novas rolagens; depois mantém a ordem de entrada (protagonistas antes de inimigos) | Qual critério o narrador/IA usa? |
| P-04 | PROVISÓRIO | “Especialidade pertinente” na iniciativa | Armas Curtas, Armas Longas, Combate Corpo a Corpo, Liderança Tática (`rules.initiativeSpecialties`) | Quais especialidades contam? Evasão? Reflexos Instintivos influencia? |
| P-11 | PROVISÓRIO | Defesa / esquiva | Ação “Defender-se” consome o turno; até o próximo turno do personagem, cada ataque que acertar exige um D6 de Reflexo do alvo — sucesso anula o ataque | Como funciona a defesa? Consome o turno? Usa D20 com alguma especialidade? |
| P-12 | PROVISÓRIO | Cobertura | “Procurar cobertura” consome o turno e exige D6 de Reflexo; em cobertura, ataques com arma de fogo que acertarem exigem um D6 de Reflexo — sucesso bloqueia. Testado antes da esquiva. A cobertura persiste. | Qual o efeito da cobertura? Quando termina? Vale contra ataques corpo a corpo? |
| P-13 | PROVISÓRIO | Fuga | D20 Reflexo + Evasão; sem Evasão, D6 de Reflexo | Qual teste resolve a fuga? |
| P-14 | PROVISÓRIO | Resolução da cooperação | Vale o **melhor** resultado entre ator e ajudantes; só pode cooperar fora da vez quem ainda não agiu na rodada; fora de combate não há D6 de Reflexo; em investigação um ajudante bem-sucedido libera um trecho “cooperação” | Como o D20 cooperativo é resolvido? Quem já agiu pode cooperar? |
| P-28 | PROVISÓRIO | Ações por turno e movimentação | Uma ação por turno; sem movimentação/distâncias; “Utilizar item” = empunhar arma guardada; interação de ambiente “Gritar por socorro” (D6 Presença) faz criminosos comuns fugirem no fim da rodada | Quantas ações por turno? Há movimentação? Que usos de item existem? |
| P-27 | PROVISÓRIO | Fichas de inimigos | Criminoso: atributos 2/2/2/1/2, 10 PV; Capanga: 3/2/2/2/3, 12 PV; Morto reanimado: Raciocínio/Presença/Espírito 0. IA inimiga escolhe alvos aleatórios | Atributos e PV dos inimigos humanos? |
| P-29 | PENDENTE | Contagem de munição | Munição existe como item, sem contagem | Haverá contagem de munição/recarga? |
| P-32 | PROVISÓRIO | Derrota | Se ninguém do grupo puder agir, fim de jogo | O que acontece numa derrota total? Captura, resgate? |

## Dano, PV e letalidade

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-05 | PROVISÓRIO | Dano excedente | Dano que leva a 0 para em 0 (Às Portas da Morte), sem matar direto; dano 0 contra quem está a 0 não mata | Dano excedente pode matar diretamente? |
| P-09 | PROVISÓRIO | Crítico de arma de fogo contra humanos | Mata humanos/ghouls **inimigos**; contra protagonistas, apenas dano dobrado | “Pode matar” é automático? Vale para os protagonistas? |
| P-10 | PROVISÓRIO | Vampiro com 0 PV | Continua ativo; só é destruído pelos críticos de arma de fogo | Regeneração, incapacitação, luz solar, fogo, estacas e disciplinas — aguardando especificação |

## Sistema médico e Sanidade

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-06 | PROVISÓRIO | Tratamento exige teste? | Sim: D20 Raciocínio + especialidade (sem ela, só o atributo); falha não cura | O tratamento é automático ou exige teste? Com qual atributo? |
| P-07 | PROVISÓRIO | Estabilização às Portas da Morte | Tratamento permitido com teste, como em qualquer ferido; sem cura automática | Como estabilizar? Há prazo até a morte? |
| P-08 | PROVISÓRIO | “Procedimentos complexos” em si mesmo | Apenas Cirurgia | Medicina de Emergência também é complexa? |
| P-18 | PROVISÓRIO | Foco com Sanidade 1–4 | Antes de cada teste em cena: D6 de Espírito; falha perde a ação e 10 minutos | Quando o teste de foco ocorre e o que a falha causa? |
| P-19 | PROVISÓRIO | Ajuda psiquiátrica | Automática (sem teste), leva 30 minutos | Exige teste? Quanto tempo? |
| P-38 | PROVISÓRIO | Tabela de horror | Três tipos: evidência estranha (0), horror humano (−1 com teste), manifestação sobrenatural (−1 automático) | Haverá níveis mais intensos? |

## Inventário e progressão

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-17 | PROVISÓRIO | Capacidade dos bolsos | Sem limite numérico; só objetos pequenos permitidos | Há limite de objetos nos bolsos? |
| P-24 | PROVISÓRIO | Equipamento inicial | Lista provisória por personagem (ex.: Jack com revólver .38; Mick com pistola 9mm; Daniel com kit médico) | Qual o equipamento inicial de cada profissão? |
| P-16 | PENDENTE | Destino do +1 a cada 20 XP | XP e melhorias são contados; **gasto desabilitado** | O +1 vai para atributo (com limite 5?), nova especialidade, ou ambos? Custo de aprender especialidade de outra profissão? |
| P-36 | PENDENTE | Ambidestro | Registrado sem efeito, pois não há regra de mão secundária | Existe penalidade de mão secundária ou ataque com duas armas? |

## Tempo, mundo e conspiração

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-20 | PROVISÓRIO | Durações | Examinar 10 min, investigar 20, conversa 15, deslocamento 40, tratamento 20, espera 60 | Durações de referência? |
| P-21 | PROVISÓRIO | Hora inicial | 16h50 de 1º/12/1992 | O caso Reed começa a que horas? |
| P-25 | PROVISÓRIO | Estados da conspiração | Escala numérica sem teto; valores iniciais baixos; +1/dia em Sangues-Ralos, necromantes e Camarilla | Escalas, ritmos e gatilhos de cada estado? (Sem números de vítimas, prazos ou condições de vitória.) |
| P-37 | PROVISÓRIO | Cronologia Hecata | Facção tratada como precursora em 1992 | Autoriza cronologia alternativa? |

## Narrativa e conteúdo proposto

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-30 | PROVISÓRIO | Caso Reed sem Jack no grupo | O contato passa a ser Ray, depois Liz, depois o primeiro escolhido. Jack “sumiu há dois dias” por causa das dívidas e deixou o escritório com o contato; Victoria chega procurando Jack. O diálogo canônico troca apenas o nome em “ergueu as sobrancelhas” | Essa adaptação é aceitável? |
| P-31 | PROVISÓRIO | Conteúdo autoral do capítulo de demonstração | Propostas: porteiro Sal Benedetto; endereço Rua 78 Leste, 211, ap. 5C; agenda com páginas arrancadas e decalque “R.W. — Ludlow”; Halcyon Holdings e transferências assinadas por “R. Whitmore”; secretária eletrônica com três mensagens; banheiro lavado com sangue e resíduo de anticoagulante; clube Nocturne (Ludlow St.); símbolo funerário “invertido”; dois invasores contratados; sedã vigiando o prédio | Aprovar, ajustar ou substituir cada elemento. Nenhum deles confirma a existência de vampiros. |
| P-34 | PROVISÓRIO | Memória Fotográfica | Pistas podem ter um “detalhe de memória”, exibido no diário se alguém com o bônus estava presente na descoberta | A implementação respeita a intenção? |
| P-35 | PROVISÓRIO | Sinal do Instinto de Perigo | Ao entrar em cenas marcadas, o narrador avisa “sente um arrepio: …” sem revelar a origem | OK? |
| P-41 | PENDENTE | Cenas jogáveis do Bellevue e do Village Voice | Casos, objetivos, NPCs e pistas-gancho já existem; cenas ainda não | Roteiro das duas linhas |
| P-42 | PENDENTE | Natureza de Victoria, destino de Thomas, papel de Richard | Marcados como PENDENTE na camada interna | Definições do criador |

## IA, narrador e multijogador

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-26 | PROVISÓRIO | IA de linguagem como mestre | No jogo publicado, o Claude interpreta respostas livres: encaixa numa ação pronta ou **improvisa** (falas de NPCs presentes, narração, teste de dados rolado pelo motor, ±1 de confiança). Usa só a camada do jogador e os roteiros de improviso; não cria pistas, nomes, lugares nem fatos; termos da conspiração não descobertos descartam a resposta. Não cria cenas ou capítulos novos | A IA pode, no futuro, gerar cenas inteiras? Pode conceder pistas menores criadas na hora? |
| P-39 | PROVISÓRIO | Até 4 pessoas + mestre | Cada personagem pode ser “Jogador” ou “IA” (troca a qualquer momento na ficha) — jogo local compartilhado. Modo Mestre opcional mostra a camada interna e permite conceder XP e avançar o tempo | Haverá multijogador em rede? O mestre humano deve poder editar cenas em tempo real? |

## Imagens, voz e resposta livre

| Código | Status | Tema | Solução atual | Pergunta |
|---|---|---|---|---|
| P-43 | PROVISÓRIO | Licença das fotos de acervo | Só fotos em domínio público, CC0, CC BY ou CC BY-SA, com crédito na tela e na Galeria. CC BY-SA exige compartilhar derivados sob a mesma licença | Se o jogo for comercializado, substituir as fotos CC BY-SA por imagens próprias? |
| P-44 | PROVISÓRIO | Vozes por personagem | Padrão: um narrador lê tudo (audiolivro). Opcional: voz por personagem, escolhida pelo jogador ouvindo as 4 vozes disponíveis (não há indicação de timbre) | Qual voz combina com cada personagem? |
| P-45 | PROVISÓRIO | Resposta livre sem ação correspondente | O narrador responde, passam 5 minutos, nenhum efeito mecânico | Uma tentativa sem correspondência deve custar mais tempo ou ter consequências? |
| P-46 | PENDENTE | Imagens de personagens, NPCs e objetos | Vagas com prompts prontos (`IMAGE_PROMPTS.md`); o dono/editor envia pela Galeria do jogo publicado | Gerar e enviar as imagens |
| P-47 | PROVISÓRIO | Onde o grupo está no início | Só o contato (Jack, se escolhido) espera a cliente no escritório. Os demais estão em seus afazeres (Bellevue, Village Voice, livraria, turno, serviço) e só podem ser chamados por telefone depois que a cliente sai; chegam em 30–50 min. Ao ligar, Daniel conta do paciente do Bellevue e Liz demonstra interesse nos corpos sem nome | Quem deve estar no escritório quando Victoria chega? Como e quando os outros se juntam? |
| P-48 | PROVISÓRIO | Roteiros de improviso | Para cada cena: ambiente e objetos presentes; para cada NPC: quem é, como fala, o que conta, o que evita, o que não sabe (`src/data/campaign/briefs.ts`). Victoria só diz o nome se perguntada (ou ao deixar o cartão) | Ajustar a personalidade e o que cada NPC aceita contar |
