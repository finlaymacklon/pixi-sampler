import fs from "fs-extra-promise";

const instanceName = "PDEBUG";

/**
 * Inject our automation scripts into the page.
 * @arg {Object} page - PlayWright reference to page.
 */
export async function loadScript(page) {
  const pathToPd = import.meta.url.replace("file://", "").replace("api", "PixiDebugger");
  await page.addScriptTag({ "path": pathToPd });
}

/**
 * Create an instance of the pixiDebugger in the running canvas application.
 * @arg {Object} page - PlayWright reference to page.
 */
export async function injectDebugger(page) {
  const pdebugStartCode = `
    const ${instanceName} = new PixiDebugger; 
    window.${instanceName} = ${instanceName};
    ${instanceName}.inject();
  `
  await page.addScriptTag({ "content": pdebugStartCode });
}

/**
 * Grab a snapshot of the current canvas application state.
 * @arg {Object} page - PlayWright reference to page.
 * @arg {Object} canvas - PlayWright reference to the canvas.
 */
 export async function getStateSnapshot(page, canvas, snapshotPath) {
  // const getState = makeGameSelector([
  //   mapProperties([
  //     "x", 
  //     "y", 
  //     "zIndex", 
  //     "height", 
  //     "width", 
  //     "alpha", 
  //     "visible", 
  //     "angle",
  //     "rotation", 
  //     "type",
  //     "texture?.baseTexture?.resource?.url",
  //     "texture?.frame",
  //     "scale?.x",
  //     "scale?.y",
  //     "anchor?.x",
  //     "anchor?.y",
  //     "tilePosition?.x",
  //     "tilePosition?.y",
  //     "text",
  //     "_font"
  //   ])
  // ]);
  await freezeAnimations(page);
  // take and save image of rendered content (png) on the <canvas>
  const imgPath = `${snapshotPath}.png`;
  await canvas.screenshot({path: imgPath});
  // read the jsonValue of frozen state 
  const getState = `new Object({
    resolution: ${instanceName}.resolution,
    size: ${instanceName}.size,
    scene: ${instanceName}.renderedState
  });`
  const stateHandle = await page.evaluateHandle(getState);
  const stateJson = await stateHandle.jsonValue();
  // restart animations
  await unfreezeAnimations(page);
  // save JSON with state of objects on <canvas>
  const jsonPath = `${snapshotPath}.json`;
  await fs.writeFileAsync(jsonPath, JSON.stringify(stateJson));
  return stateJson, imgPath;
}
/**
 *
 */
export async function freezeAnimations(page) {
  await page.evaluate(`${instanceName}.isFreezing = true;`);// ${instanceName}.hasFrozenState = false;`);
}
/**
 *
 */
export async function unfreezeAnimations(page) {
  await page.evaluate(`${instanceName}.isFreezing = false;`);// ${instanceName}.hasFrozenState = false;`);
}
/**
 * make code to inject to start operating on the game objects list.
 * @arg {string[]} [steps=[]]: steps to add to game object(s) selector.
 */
export function makeGameSelector(steps=[]) {
  let selectionCode = `${instanceName}.scene`;
  for (const idx in steps) {
    selectionCode += `.${steps[idx]}`;
  }
  return selectionCode;
}
/**
 * make code to filter on game objects list.
 * @arg {string} condition - how to filter the objects.
 */
function makeFilter(condition) {
  return `filter(o => ${condition})`;
}
/**
 * Filter the game automation list by url of object's resource.
 * @arg {string} url - object resource url.
 */
export function filterByResource(url) {
  return makeFilter(`o?.texture?.baseTexture?.resource?.url === "${url}"`);
}
/**
 * Filter the game automation list by type of object.
 * @arg {string} type - object type to match.
 */
export function filterByType(type) {
  return makeFilter(`${instanceName}.inferType(o) === "${type}"`);
}
/**
 * Filter the game automation list by text of object.
 * @arg {string} text - object text to match.
 */
export function filterByText(text) {
  return makeFilter(`o.text === "${text}"`);
}
/**
 * Filter the game automation list by visibility of object.
 * @arg {boolean} isVisible - whether to get visible or invisible objects.
 */
export function filterByVisible(isVisible) {
  return makeFilter(`o.visible === ${isVisible}`);
}
/**
 * make code to map on game objects list.
 * @arg {string} result - how to map objects to desired result.
 */
function makeMap(result) {
  return `map(o => Object(${result}))`;
}
/**
 * make code to map on game objects list.
 * @arg {string[]} propsList - list of properties on object to return.
 */
export function mapProperties(propsList) {
  let retState = `{`;
  for (const idx in propsList) {
    const p = propsList[idx];
    const pName = p.replace(/\./g, '_').replace(/\?/g, '');
    if (pName == 'type') {
      retState += ` ${pName}: ${instanceName}.inferType(o),`;
    } else {
      retState += ` ${pName}: o?.${p},`;
    }    
  } 
  retState += ` }`;
  let mapReturnProps = makeMap(retState);
  return mapReturnProps;
}
