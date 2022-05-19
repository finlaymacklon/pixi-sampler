import { PixiExposer } from "../../src/PixiExposer";

(() => {
  const __PIXI_EXPOSER__ = new PixiExposer();
  window.__PIXI_EXPOSER__ = __PIXI_EXPOSER__;
  __PIXI_EXPOSER__.expose();
})();
