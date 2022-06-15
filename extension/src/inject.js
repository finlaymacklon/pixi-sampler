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
    const scaleX = parseFloat(canvas.style.width) / canvas.width;
    const scaleY = parseFloat(canvas.style.height) / canvas.height;
    const nodes = findNodesWithAsset(pixi_exposer.cor).flat(Infinity);//.reverse().sort();
    // console.log(nodes);
    const showTooltip = nodes.map(o => {
      if (!o.visible || !o.renderable || o.worldAlpha <= 0) return;
      // if (!o) return;
      // if (!o.worldPosition) return;
      // if (!o?._texture?.baseTexture?.resource?.url) return;
      // get coordinates by traversing up the tree along parents
      // const pos = getPosition(o);
      let left = o.vertexData[0];
      let top = o.vertexData[1];
      let width = o.vertexData[2] - o.vertexData[0];
      let height = o.vertexData[7] - o.vertexData[1];
      if (o._anchor) {
        left = (left - (o._anchor._x * width)) * scaleX;
        top = (top - (o._anchor._y * height)) * scaleY;
      } else {
        left = left * scaleX;
        top = top * scaleY;
      }
      width = width * scaleX;
      height = height * scaleY;
      const dx = e.offsetX - left;
      const dy = e.offsetY - top;
      const isHit = (dx >= 0) && (dx <= width) && (dy >= 0) && (dy <= height);
      if (isHit) { //} && name) {
        tooltip.style.left = `${e.clientX-parseFloat(tooltip.style.width)-10}px`;
        tooltip.style.top = `${e.clientY-parseFloat(tooltip.style.height)-10}px`;
        const name = o.name;
        const key = o.key || o.fontName;
        tooltip.innerText = `name: ${name},\nkey: ${key}`;
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

function findNodesWithAsset(node) {
  if (node?._texture?.baseTexture?.resource?.url !== undefined)
    return node;
  if (node.children)
    return node.children.map(child => findNodesWithAsset(child));
}

// function findNode(node, name) {
//   if (node.name === name)
//       return node;
//   if (node.children)
//       return node.children.map(c => findNode(c))
// }
// >>> findNode(__PIXI_EXPOSER__.cor, "boots").flat(Infinity)[0]