import { BONUSES } from '../data/bonuses';
import { DAMAGE_TABLE, damageFormula } from '../engine/damage';
import { HORROR_EVENTS, SANITY_LABELS } from '../engine/sanity';
import { TREATMENTS } from '../engine/medical';
import { useGame } from '../state/GameContext';
import { Tag } from '../components/ui';

export function RulesScreen() {
  const { go } = useGame();
  return (
    <main className="doc-screen">
      <header className="doc-head">
        <button className="btn-ghost" onClick={() => go('menu')}>← Menu</button>
        <h1>Regras</h1>
      </header>
      <div className="rules">
        <section className="paper-card">
          <h2>Atributos</h2>
          <p>Físico, Reflexo, Raciocínio, Presença e Espírito, de 0 a 5. Cada personagem tem 13 pontos fixos pela profissão. Atributo 0 impede ações que dependam dele.</p>
        </section>
        <section className="paper-card">
          <h2>Teste simples — D6</h2>
          <p>Sucesso quando o resultado é <strong>igual ou inferior</strong> ao atributo. <strong>6 natural é sempre falha.</strong></p>
        </section>
        <section className="paper-card">
          <h2>Teste de ação — D20</h2>
          <table className="table">
            <tbody>
              <tr><td>Sem especialidade</td><td>Limite = atributo</td></tr>
              <tr><td>Com especialidade</td><td>Limite = atributo + 10</td></tr>
              <tr><td>Com especialidade e bônus aplicável</td><td>Limite = atributo + 15</td></tr>
              <tr><td>Com especialidade sob ônus</td><td>Limite = atributo + 8</td></tr>
            </tbody>
          </table>
          <p><strong>1 natural é sempre falha.</strong> Crítico: resultado exatamente igual ao limite, exigindo a especialidade. Bônus e ônus não acumulam, não se sobrepõem e não se anulam.</p>
          <p className="muted">Quando um bônus e um ônus de bônus diferentes disparam juntos, a precedência é <Tag tone="warn">provisória</Tag> (ver Configurações).</p>
        </section>
        <section className="paper-card">
          <h2>Dano</h2>
          <table className="table">
            <tbody>{Object.entries(DAMAGE_TABLE).map(([k, d]) => <tr key={k}><td>{d.label}</td><td>{damageFormula(k as keyof typeof DAMAGE_TABLE)}</td></tr>)}</tbody>
          </table>
          <p>Crítico dobra o dano <strong>total</strong>. Todos os protagonistas têm 20 PV. Com 0 PV: Às Portas da Morte — qualquer dano adicional mata. Não há armaduras.</p>
          <p>Balas comuns não matam vampiros. Um crítico com arma de fogo pode matar um humano ou ghoul; dois, um vampiro comum; três, um vampiro-mestre.</p>
        </section>
        <section className="paper-card">
          <h2>Combate</h2>
          <p>Iniciativa: D6 (+2 com especialidade pertinente, +1 para o Operativo). Empates: nova rolagem. Cobertura consome o turno e é testada antes da defesa/esquiva.</p>
          <p>Cooperação fora da vez: teste de Reflexo (D6). Sucesso — coopera e mantém o turno. Falha — não coopera e vai para o fim da fila. No máximo dois ajudantes.</p>
          <p className="muted">Ações por turno, movimentação e defesa/esquiva detalhadas estão <Tag tone="warn">pendentes</Tag>; o protótipo usa soluções provisórias.</p>
        </section>
        <section className="paper-card">
          <h2>Tratamento médico</h2>
          <table className="table"><tbody>{Object.values(TREATMENTS).map((t) => <tr key={t.label}><td>{t.label}</td><td>1D6 {t.modifier > 0 ? `+ ${t.modifier}` : `− ${-t.modifier}`} PV</td></tr>)}<tr><td>Medicina Legal</td><td>não recupera PV</td></tr></tbody></table>
          <p>Consome um turno. O Médico pode tratar a si mesmo, mas não realizar Cirurgia em si. Máximo de 20 PV.</p>
        </section>
        <section className="paper-card">
          <h2>Sanidade</h2>
          <p>Começa em 10. {Object.entries(SANITY_LABELS).map(([k, v]) => <Tag key={k}>{v}</Tag>)}</p>
          <p>8–10 São · 5–7 Paranoia · 2–4 Comprometimento (testes de Espírito para manter o foco) · 1 À beira do colapso · 0 Loucura irreversível.</p>
          <ul className="compact">{Object.values(HORROR_EVENTS).map((e) => <li key={e.label}>{e.label}: {e.mode === 'nenhuma' ? 'sem perda' : e.mode === 'automatica' ? `perda automática de ${e.loss}` : `perda de ${e.loss} se falhar em Espírito`}</li>)}</ul>
          <p>Recuperação: um teste de Espírito por dia (sucesso: +1). Psiquiatria: o Médico não cai abaixo de 5 e pode recuperar 1 ponto de outro personagem por dia, se estiver com 8–10.</p>
        </section>
        <section className="paper-card">
          <h2>Inventário e progressão</h2>
          <p>Duas mãos (2 espaços), bolsa (3 espaços) e bolsos para objetos pequenos. Munição, kits médicos e objetos grandes não cabem nos bolsos.</p>
          <p>A cada 20 XP, uma melhoria de +1. Qualquer personagem pode aprender especialidades de outras profissões. O destino do +1 está <Tag tone="warn">pendente</Tag>.</p>
        </section>
        <section className="paper-card">
          <h2>Bônus</h2>
          <ul className="compact">{BONUSES.map((b) => <li key={b.id}><strong>{b.number}. {b.name}:</strong> {b.description}{b.onus ? <em> Ônus: {b.onus.description}</em> : null}</li>)}</ul>
        </section>
      </div>
    </main>
  );
}
