import { GameProvider, useGame } from '../state/GameContext';
import { MainMenu } from '../screens/MainMenu';
import { PrologueScreen } from '../screens/PrologueScreen';
import { PartySetup } from '../screens/PartySetup';
import { GameScreen } from '../screens/GameScreen';
import { CharactersScreen } from '../screens/CharactersScreen';
import { RulesScreen } from '../screens/RulesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoadScreen } from '../screens/LoadScreen';

function Router() {
  const { screen, toast } = useGame();
  return (
    <>
      {screen === 'menu' && <MainMenu />}
      {screen === 'prologo' && <PrologueScreen />}
      {screen === 'selecao' && <PartySetup />}
      {screen === 'jogo' && <GameScreen />}
      {screen === 'personagens' && <CharactersScreen />}
      {screen === 'regras' && <RulesScreen />}
      {screen === 'config' && <SettingsScreen />}
      {screen === 'carregar' && <LoadScreen />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  );
}
