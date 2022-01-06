import { PixiDebugger } from "../../src/PixiDebugger";

(() => {
  const canvas = document.querySelector("canvas");
  const __pixi_debugger__ = new PixiDebugger;
  window.__pixi_debugger__ = __pixi_debugger__;
  __pixi_debugger__.inject();

  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'block';
  tooltip.style.borderBottom = '1px dotted black';
  tooltip.style.width = '120px';
  tooltip.style.height = '24px';
  tooltip.style.background = 'black';
  tooltip.style.color = 'white';
  tooltip.style.textAlign = 'center';
  tooltip.style.padding = '2px';
  tooltip.style.fontSize = '12px';
  tooltip.style.fontFamily = 'sans-serif';
  tooltip.style.zIndex = 9999;
  tooltip.style.opacity = 50;
  tooltip.hidden = true;
  //canvas.parentElement.style.position = "relative";
  canvas.parentElement.appendChild(tooltip)

  canvas.addEventListener("mousemove", (e) => {
    const showTooltip = __pixi_debugger__.o.map(o => {
      let left, top;
      if (o.anchor) {
        left = o.x - (o.anchor.x * o.width);
        top = o.y - (o.anchor.y * o.height);
      } else {
        left = o.x;
        top = o.y;
      }
      const dx = e.offsetX - left;
      const dy = e.offsetY - top;
      const isHit = (dx > 0) && (dx < o.width) && (dy > 0) && (dy < o.height);
      //const name = o.name;
      if (isHit) { //} && name) {
        //console.log({ name, left, top, dx, dy, isHit })
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.innerText = `{name: ${o.name}, type: ${o.type}}`;
        //tooltip.style.width = `${o.width}px`;
        //tooltip.style.height = `${o.height}px`;
      }
      return isHit;
    }).reduce((total, val) => total || val, false);
    if (showTooltip) {
      tooltip.hidden = false;
    } else {
      tooltip.hidden = true;
    }

  })
})();