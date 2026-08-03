export interface GameDefinition {
  id: string
  name: string
  description: string
  icon: string
  routeName: string
  status: 'available' | 'coming-soon'
}

/*
 * Datengetriebene Spieleliste für die Home-Übersicht. Ein neues Spiel
 * hinzufügen = neuer Eintrag hier + eigener Router-Namespace
 * (analog zu /impostor/*) - HomeView und GameCard bleiben unangetastet.
 */
export const GAMES: GameDefinition[] = [
  {
    id: 'impostor',
    name: 'Impostor',
    description: 'Ein Wort. Eine Lüge. Wer fliegt auf?',
    icon: '🕵️',
    routeName: 'impostor-setup',
    status: 'available',
  },
  {
    id: 'coming-soon-1',
    name: 'Bald verfügbar',
    description: 'Das nächste Spiel für den Freundeskreis ist in Arbeit.',
    icon: '✨',
    routeName: '',
    status: 'coming-soon',
  },
  {
    id: 'coming-soon-2',
    name: 'Bald verfügbar',
    description: 'Noch eine Idee in der Pipeline.',
    icon: '🎲',
    routeName: '',
    status: 'coming-soon',
  },
]
