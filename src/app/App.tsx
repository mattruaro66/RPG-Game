import { GameProvider, useGame } from '../state/GameContext';
import { MainMenu } from '../screens/MainMenu';
import { PrologueScreen } from '../screens/PrologueScreen';
import { PartySetup } from '../screens/PartySetup';
import { GameScreen } from '../screens/GameScreen';
import { CharactersScreen } from '../screens/CharactersScreen';
import { RulesScreen } from '../screens/RulesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoadScreen } from '../screens/LoadScreen';
import { GalleryScreen } from '../screens/GalleryScreen';
import { ImagesProvider } from '../platform/images';
import { VoiceProvider } from '../platform/voice';

function Router() {
  const { screen, toast, settings } = useGame();
  return (
    <VoiceProvider voices={settings.voices} rate={settings.voiceRate}>
      {screen === 'menu' && <MainMenu />}
      {screen === 'prologo' && <PrologueScreen />}
      {screen === 'selecao' && <PartySetup />}
      {screen === 'jogo' && <GameScreen />}
      {screen === 'personagens' && <CharactersScreen />}
      {screen === 'regras' && <RulesScreen />}
      {screen === 'config' && <SettingsScreen />}
      {screen === 'carregar' && <LoadScreen />}
      {screen === 'galeria' && <GalleryScreen />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </VoiceProvider>
  );
}

export function App() {
  return (
    <GameProvider>
      <ImagesProvider>
        <Router />
      </ImagesProvider>
    </GameProvider>
  );
}
