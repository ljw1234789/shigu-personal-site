import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
export default {
 root:'sources/', publicDir:'../../world/', base:'./',
 server:{host:'127.0.0.1',open:false},
 build:{outDir:'../build',emptyOutDir:true,sourcemap:false},
 define:{
  'import.meta.env.VITE_SERVER_URL':JSON.stringify(''),
  'import.meta.env.VITE_GAME_PUBLIC':JSON.stringify(''),
  'import.meta.env.VITE_COMPRESSED':JSON.stringify('1'),
  'import.meta.env.VITE_DAY_CYCLE_PROGRESS':JSON.stringify('0.25'),
  'import.meta.env.VITE_YEAR_CYCLE_PROGRESS':JSON.stringify('0.8'),
  'import.meta.env.VITE_WHISPERS_COUNT':JSON.stringify('0'),
  'import.meta.env.VITE_MUSIC':JSON.stringify('1'),
  'import.meta.env.VITE_LOG':JSON.stringify(''),
  'import.meta.env.VITE_PLAYER_SPAWN':JSON.stringify('landing')
 },
 plugins:[wasm(),topLevelAwait(),nodePolyfills()]
}
