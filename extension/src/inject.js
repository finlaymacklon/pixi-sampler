import { PixiExposer } from "../../src/PixiExposer";

(() => {
  const __PIXI_EXPOSER__ = new PixiExposer();
  window.__PIXI_EXPOSER__ = __PIXI_EXPOSER__;
  __PIXI_EXPOSER__.expose();
  addTooltip(__PIXI_EXPOSER__);
})();

// FOR THE DEMO
function addTooltip(pixi_exposer){
  const canvas = document.querySelector("canvas");

  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'block';
  // tooltip.style.borderBottom = '1px dotted black';
  tooltip.style.width = '140px';
  tooltip.style.height = '60px';
  tooltip.style.background = 'white';
  tooltip.style.color = 'black';
  tooltip.style.textAlign = 'center';
  tooltip.style.padding = '2px';
  tooltip.style.fontSize = '12px';
  tooltip.style.fontFamily = 'sans-serif';
  tooltip.style.zIndex = 9999;
  tooltip.style.opacity = 50;
  tooltip.style.userSelect = 'none';
  tooltip.style.borderRadius = '6px';
  tooltip.style.opacity = 0.8;
  tooltip.hidden = true;
  //canvas.parentElement.style.position = "relative";
  canvas.parentElement.appendChild(tooltip)
  // canvas.appendChild(tooltip)

  canvas.addEventListener("mousemove", (e) => {
    const showTooltip = pixi_exposer.nodes.map(o => {
      if (!o) return;
      if (!o.worldPosition) return;
      let left = o.worldPosition.x;
      let top = o.worldPosition.y;
      if (o.anchor) {
        left = (left - (o.anchor.x * o.width))// * devicePixelRatio;
        top = (top - (o.anchor.y * o.height))// * devicePixelRatio;
      } else {
        left = left //* devicePixelRatio;
        top = top// * devicePixelRatio;
      }
      const width = o.width //* devicePixelRatio;
      const height = o.height //* devicePixelRatio;
      const dx = e.offsetX - left;
      const dy = e.offsetY - top;
      const isHit = (dx >= 0) && (dx <= width) && (dy >= 0) && (dy <= height);
      //const name = o.name;
      if (isHit) { //} && name) {
        // console.log({ left, top, dx, dy, isHit })
        tooltip.style.left = `${e.clientX+50}px`;
        tooltip.style.top = `${e.clientY-20}px`;
        // tooltip.style.left = left;
        // tooltip.style.top = top;
        tooltip.innerText = `name: ${o.name},\nkey: ${o.key || o.fontName}`;
        // tooltip.style.width = `${width}px`;
        // tooltip.style.height = `${height}px`;
      }
      return isHit;
    }).reduce((total, val) => total || val, false);
    if (showTooltip) {
      tooltip.hidden = false;
    } else {
      tooltip.hidden = true;
    }
  })
}