import { PixiExposer } from "../../src/PixiExposer";

(() => {
  const __pixi_exposer__ = new PixiExposer();
  window.__pixi_exposer__ = __pixi_exposer__;
  __pixi_exposer__.inject();
})();
