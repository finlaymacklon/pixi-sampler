/**
 * Modify PIXI's rendering method to track PIXI objects rendered to the <canvas>.
 * Whenever PIXI re-renders the stage using PIXI.Application.render(), find objects
 * that are renderable and visible, and add them to our list of tracked objects.
 * 
 * TODO
 * Is it a good idea to check whether object's bounding box is within canvas viewport?
 * ...probably not, because that is a lot of extra computation vs. just checking when we need to.
 * 
 * TODO
 * NEED to write methods for getting and setting.
 * 
 * @author Finlay Macklon
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
        this.o = [];
        this.constructors = [];
        this.types = [];
        this.renderedState = [];
    }
    /**
     * Inject the game renderer method with our tracking code
     */
    inject() {
        if (!PIXI)
            return;
        if (this.isInjected)
            return 0;
        // register the types present in global PIXI object
        this.discoverTypes(PIXI, this.rootName, this.maxDepth);
        // keep reference to pixiDebugger object
        const self = this;
        // TODO maybe check PIXI.RENDERER_TYPE then load the correct renderer?
        const Renderer = PIXI.Renderer;
        // original rendering function
        const renderFunction = Renderer.prototype.render;
        // injected rendering function
        Renderer.prototype.render = function (stage, ...args) {
            if (self.isFreezing)
                return;

            // (de-)register objects from debugger list
            self.o = [];
            // stage is the root of scene graph (app.stage)
            self.findVisibleObjects(stage);

            // this === instance of Renderer
            renderFunction.apply(this, [stage, ...args]);

            // take snapshot of state of objects that were just rendered
            self.renderedState = self.takeStateSnapshot();
        }
        // // // also prevent update while renderer is frozen.....?
        // const Ticker = PIXI.Ticker;
        // const updateFunction = Ticker.prototype.update;
        // Ticker.prototype.update = function (currentTime, ...args) {
        //     if (self.isFreezing)
        //          return;
        //     updateFunction.apply(this, [currentTime, ...args]);
        // }
        // const sharedTickFunction = Ticker._shared._tick;
        // Ticker._shared._tick = function (time) {
        //     if (self.isFreezing) {
        //         setTimeout(() => Ticker._shared._tick(time), Ticker._shared._maxElapsedMS);
        //         // Ticker._shared._tick(time);
        //     } else {
        //         sharedTickFunction.apply(this, [time]);    
        //     }
        // }
        // const systemTickFunction = Ticker._system._tick;
        // Ticker._system._tick = function (time) {
        //     if (self.isFreezing) {
        //         setTimeout(() => Ticker._system._tick(time), Ticker._system._maxElapsedMS);
        //         // Ticker._shared._tick(time);
        //     } else {
        //         systemTickFunction.apply(this, [time]);    
        //     }
        // }
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
     * may find it useful to check _lastObjectRendered
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
            this.o.push(node);
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
    isRelevant(node, nodeType) {
        return (
            (nodeType !== "PIXI.Graphics") &&
            (nodeType !== "PIXI.Container") &&
            this.isVisible(node)
        )
    }
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
        const stateJson = this.o.map(o => {
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
                    // debugger
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
                    // const pName = p.replace(/\./g, "_").replace(/\?/g, "");
                    const pName = pChain.reduce(reducer, pChain[0]);
                    state[pName] = node;
                }
            })
            return Object.assign({}, state);
        });
        return stateJson;
    }
}
