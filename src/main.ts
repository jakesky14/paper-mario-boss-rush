import { Game } from './game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('No canvas element found');
}

const game = new Game(canvas);
game.start();
