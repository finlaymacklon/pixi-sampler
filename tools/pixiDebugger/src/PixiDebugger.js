/**
 * Modify PIXI's rendering method to track PIXI objects rendered to the <canvas>.
 * Whenever PIXI re-renders the stage using PIXI.Application.render(), find objects
 * that are renderable and visible, and add them to our list of tracked objects.
 */

/**
 * Class for accessing PIXI objects that are rendered to <canvas>
 */
class PixiDebugger {
    constructor() {
        this.isInjected = false;
        this.isFreezing = false;
        this.rootName = "PIXI";
        this.maxDepth = 2;
        this.constructors = [];
        this.types = [];
        this.scene = [];
        this.renderedState = [];
        this.resolution = 0;
        this.size = [0, 0];
    }
    /**
     * Inject the game renderer method with our tracking code
     */
    inject() {
        if (!PIXI)
            return;
        if (this.isInjected === true)
            return 0;
        // register the types present in global PIXI object
        this.discoverTypes(PIXI, this.rootName, this.maxDepth);
        // keep reference to pixiDebugger object
        const self = this;
        const Renderer = PIXI.Renderer;
        // original rendering function
        const renderFunction = Renderer.prototype.render;
        // injected rendering function
        Renderer.prototype.render = function (stage, ...args) {
            // prevent rendering when freezing animations
            if (self.isFreezing)
                return;
            // (de-)register objects from debugger list
            self.scene = [];
            // stage is the root of scene graph (app.stage)
            self.findVisibleObjects(stage);
            // also record the current resolution & canvas size
            self.resolution = this.resolution;
            self.size = [this.view.width, this.view.height];
            // this === instance of Renderer
            renderFunction.apply(this, [stage, ...args]);
            // take snapshot of state of objects that were just rendered
            self.renderedState = self.takeStateSnapshot();
        }
        this.isInjected = true;
        return 0;
    }
    /**
     * Refresh the list of tracked objects in the PIXI application.
     * Find all visible, renderable objects in the scene graph.
     * Assumes that application was constructed like: app = new PIXI.Application
     * And uses a single root container like: app.stage 
     * ...as specified in PIXI documentation.
     * Do not include the stage or containers in list.
     * 
     * TODO
     * may find it useful to check PIXI.Renderer._lastObjectRendered
     * and determine whether to update/overwrite part (or all of)
     * our list of tracked objects.
     * Something like:
     * if (app.renderer._lastObjectRendered === object) {
     *      self.o = [];
     * }
     */
    findVisibleObjects(node) {
        const nodeType = this.inferType(node);
        // Currently think its a good idea not to track the Graphics or Container objects
        // ...because they are not really the game objects that we see on the <canvas>.
        if (this.isRelevant(node, nodeType))
            this.scene.push(node);
        if (node.children)
            node.children.map(c => this.findVisibleObjects(c));
    }
    discoverTypes(obj, objName, depth) {
        if (depth === 0 || !this.isObject(obj))
            return;
        Object.keys(obj).map(k => {
            const childName = `${objName}.${k}`;
            if (this.isClass(obj[k], k)) {
                this.constructors.push(obj[k]);
                this.types.push(childName);
            } else {
                this.discoverTypes(obj[k], childName, depth - 1);
            }
        });
    }
    inferType(node) {
        if (!node.constructor)
            return "";
        const idx = this.constructors.indexOf(node.constructor);
        if (idx !== -1)
            return this.types[idx];
        return node.constructor.name;
    }
    //TODO reconsider if we should be doing this kind of check
    isRelevant(node, nodeType) {
        return (
            (nodeType !== "PIXI.Graphics") &&
            (nodeType !== "PIXI.Container") &&
            this.isVisible(node)
        )
    }
    //TODO reconsider if we should be doing this kind of check
    isVisible(node) {
        return (
            (node.visible) &&
            (node.renderable) &&
            (node.worldAlpha > 0)
        )
    }
    isObject(node) {
        return (
            (typeof node === "object") &&
            (node !== undefined) &&
            (node !== null) &&
            (node.constructor !== Array)
        )
    }
    isClass(node, name) {
        // assume class names begin with capital letter
        return (
            (typeof node === "function") &&
            (/\b[A-Z].*/.test(name))
        )
    }
    takeStateSnapshot() {
        const propertiesList = [
            ["x"],
            ["y"],
            ["zIndex"],
            ["height"],
            ["width"],
            ["alpha"],
            ["visible"],
            ["angle"],
            ["rotation"],
            ["type"],
            ["texture", "baseTexture", "resource", "url"],
            ["texture", "baseTexture", "scaleMode"],
            ["texture", "frame"],
            ["scale", "x"],
            ["scale", "y"],
            ["anchor", "x"],
            ["anchor", "y"],
            ["tilePosition", "x"],
            ["tilePosition", "y"],
            ["text"],
            ["_font"]
        ]
        const renderedState = this.scene.map(o => {
            const state = {}
            propertiesList.map(pChain => {
                if (pChain.length === 1) {
                    const p = pChain[0];
                    if (p in o) {
                        state[p] = o[p];
                    } else if (p == "type") {
                        state[p] = this.inferType(o);
                    }
                } else {
                    let node = o;
                    for (const idx in pChain) {
                        node = node?.[pChain[idx]];
                    }
                    if (node === undefined)
                        return;

                    const reducer = (name, currentVal, currentIdx) => {
                        if (currentIdx > 0)
                            name += `.${currentVal}`;
                        return name;
                    }
                    const pName = pChain.reduce(reducer, pChain[0]);
                    state[pName] = node;
                }
            })
            return Object.assign({}, state);
        });
        return renderedState;
    }
}
