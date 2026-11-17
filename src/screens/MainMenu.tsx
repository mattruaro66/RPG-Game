import { latestSave } from '../persistence/storage';
import { useGame } from '../state/GameContext';

export function MainMenu() {
  const { go, load, game } = useGame();
  const last = latestSave();
  return (
    <main className="menu-screen">
      <div className="menu-paper">
        <p className="menu-kicker">Arquivo confidencial · Caso nº 1201-92</p>
        <h1 className="menu-title">Nova Iorque<span>: 1992</span></h1>
        <p className="menu-sub">Investigação · Horror urbano · Conspiração</p>
        <nav className="menu-nav">
          <button className="btn-primary" onClick={() => go('prologo')}>Novo Jogo</button>
          <button disabled={!last && !game} onClick={() => (game ? go('jogo') : last && load(last.slot))}>
            Continuar{last && !game ? <small> · {last.summary}</small> : null}
          </button>
          <button onClick={() => go('carregar')}>Carregar Jogo</button>
          <button onClick={() => go('personagens')}>Personagens</button>
          <button onClick={() => go('galeria')}>Galeria de imagens</button>
          <button onClick={() => go('regras')}>Regras</button>
          <button onClick={() => go('config')}>Configurações</button>
        </nav>
        <p className="menu-foot">Protótipo jogável — capítulo de demonstração: “O desaparecimento de Thomas Reed”.</p>
      </div>
    </main>
  );
}
