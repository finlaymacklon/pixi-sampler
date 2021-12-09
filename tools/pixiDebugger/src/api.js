const instanceName = "__pixi__debugger__";

/**
 * Inject our automation scripts into the page.
 * @arg {Object} page - PlayWright reference to page.
 */
const injectTracking = async (pathToPixiDebugger, page) => {
  const pathTypeDetection = `${pathToPixiDebugger}/src/TypeDetection.js`;
  const pathPixiDebugger = `${pathToPixiDebugger}/src/PixiDebugger.js`;
  await page.addScriptTag({"path": pathTypeDetection});
  await page.addScriptTag({"path": pathPixiDebugger});
  await startPixiDebugger(page);
}

/**
 * Create an instance of the pixiDebugger in the running canvas application.
 * @arg {Object} page - PlayWright reference to page.
 */
const startPixiDebugger = async (page) => {
  const pdebugStartCode = `
    const ${instanceName} = new PixiDebugger; 
    window.${instanceName} = ${instanceName};
    ${instanceName}.inject();
  `
  await page.addScriptTag({'content': pdebugStartCode});
}

/**
 * Grab a snapshot of the current canvas application state.
 * @arg {Object} page - PlayWright reference to page.
 */
const snapshotStateJson = async (page) => {
  // also want texture.baseTexture.resource.url
  // and texture.frame
  const getState = generateGameSelector([
    mapProperties([
      "x", 
      "y", 
      "zIndex", 
      "height", 
      "width", 
      "alpha", 
      "visible", 
      "rotation", 
      "type",
      "texture?.baseTexture?.resource?.url",
      "texture?.frame",
      "scale?.x",
      "scale?.y",
      "anchor?.x",
      "anchor?.y",
      "text",
      "_font"
    ])
  ]);
  const stateHandle = await page.evaluateHandle(getState);
  const stateJson = await stateHandle.jsonValue();
  return stateJson;
}
/**
 *
 */
const stopTicker = async (page) => {
  await page.evaluate(`PIXI.Ticker._shared.stop();`);
}
/**
 *
 */
const startTicker = async (page) => {
  await page.evaluate(`PIXI.Ticker._shared.start();`);
}
/**
 * Generate code to inject to start operating on the game objects list.
 * @arg {string[]} [steps=[]]: steps to add to game object(s) selector.
 */
const generateGameSelector = (steps=[]) => {
  let selectionCode = `${instanceName}.o`;
  for (idx in steps) {
    selectionCode += `.${steps[idx]}`;
  }
  return selectionCode;
}
/**
 * Generate code to filter on game objects list.
 * @arg {string} condition - how to filter the objects.
 */
const generateFilter = (condition) => {
  return `filter(o => ${condition})`;
}
/**
 * Filter the game automation list by url of object's resource.
 * @arg {string} url - object resource url.
 */
 const filterByResource = (url) => {
  return generateFilter(`o?.texture?.baseTexture?.resource?.url === "${url}"`);
}
/**
 * Filter the game automation list by type of object.
 * @arg {string} type - object type to match.
 */
const filterByType = (type) => {
  return generateFilter(`o.type === "${type}"`);
}
/**
 * Filter the game automation list by text of object.
 * @arg {string} text - object text to match.
 */
const filterByText = (text) => {
  return generateFilter(`o.text === "${text}"`);
}
/**
 * Filter the game automation list by visibility of object.
 * @arg {boolean} isVisible - whether to get visible or invisible objects.
 */
const filterByVisible = (isVisible) => {
  return generateFilter(`o.visible === ${isVisible}`);
}
/**
 * Generate code to map on game objects list.
 * @arg {string} result - how to map objects to desired result.
 */
const generateMap = (result) => {
  return `map(o => ${result})`;
}
/**
 * Generate code to map on game objects list.
 * @arg {string[]} propsList - list of properties on object to return.
 */
const mapProperties = (propsList) => {
  let retState = `({`;
  for (idx in propsList) {
    const p = propsList[idx];
    const pName = p.replace(/\./g, '_').replace(/\?/g, '');
    retState += ` ${pName}: o?.${p},`;
  } 
  retState += ` })`;
  let mapReturnProps = generateMap(retState);
  return mapReturnProps;
}

module.exports = { injectTracking, generateGameSelector, filterByResource, filterByType, filterByText, filterByVisible, mapProperties, snapshotStateJson, stopTicker, startTicker }
