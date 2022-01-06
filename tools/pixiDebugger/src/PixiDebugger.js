/**
 * Modify PIXI's rendering method to track PIXI objects rendered to the <canvas>.
 * Whenever PIXI re-renders the stage using PIXI.Application.render(), find objects
 * that are renderable and visible, and add them to our list of tracked objects.
 * 
 * "Simple API that uses game framework to (de-)register game objects to/from a list"
 * 
 * TODO
 * - make it more pure :P  (Wayyy too many side-effects in this code)
 * 
 * @author Finlay Macklon
 */

/**
 * Class for accessing PIXI objects that are rendered to <canvas>
 */
export class PixiDebugger {
    constructor() {
        this.isInjected = false;
        this.rootName = "PIXI";
        this.maxDepth = 2;
        this.o = [];
        this.constructors = [];
        this.types = [];
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
        this.discoverTypes();
        // TODO maybe check PIXI.RENDERER_TYPE then load the correct renderer?
        const Renderer = PIXI.Renderer;
        // original rendering function
        const renderFunction = Renderer.prototype.render;
        // keep reference to pixiDebugger object
        const self = this;
        // injected rendering function
        Renderer.prototype.render = function(stage, ...args){
            // this === instance of Renderer
            const result = renderFunction.apply(this, [stage, ...args]);
            /**
             * If it turns out that some PIXI Applications use more than
             * just a single root container for rendering, then may
             * find it useful to check _lastObjectRendered
             * and determine whether to update/overwrite part (or all of)
             * our list of tracked objects.
             * Something like:
             * if (app.renderer._lastObjectRendered === object) {
             *      self.o = [];
             * }
             */
            // (de-)register objects from debugger list
            self.o = [];
            self.findVisibleObjects(stage);
            return result;
        }
        this.isInjected = true;
        return 0;
    }
    /**
     * Refresh the list of tracked objects in the PIXI application.
     * Find all visible, renderable objects in the current stage.
     * Assumes that application was constructed like: app = new PIXI.Application
     * And uses a single root container like: app.stage 
     * ...as specified in PIXI documentation.
     * Do not include the stage or containers
     * 
     * TODO
     * Is it a good idea to check whether object's bounding box is within canvas viewport?
     * ...probably not, because that is a lot of extra computation vs. just checking when we need to.
     */
    findVisibleObjects(node) {
        // side effects here. should return results and then assign seperately.
        // not idempotent.
        if (!node.type)
            node.type = this.assignType(node);
        // Currently think its a good idea not to track the Graphics or Container objects
        // ...because they are not really the game objects that we see on the <canvas>.
        if ((node.type !== "PIXI.Graphics") && (node.type !== "PIXI.Container") &&
            (node.visible) && (node.renderable))
            this.o.push(node);
        if (node.children)
            node.children.map(c => this.findVisibleObjects(c));
    }
    discoverTypes(obj=PIXI, depth=this.maxDepth) {
        if (depth === 0 || typeof obj != "object")
            return;
        Object.keys(obj).map(k => {
            if (typeof obj[k] === "function") {
                this.constructors.push(obj[k]);
                const newType = `${this.rootName}.${k}`;
                this.types.push(newType);
            // only grab objects that include length
            } else if (typeof obj[k] === "object" && obj[k].length === undefined) {
                this.discoverTypes(obj[k], depth-1);
            }
        });
    }
    assignType(node) {
        if (!node.constructor)
          return "";

        const idx = this.constructors.indexOf(node.constructor);
        if (idx !== -1) 
            return this.types[idx];
        
        const newType = this.inferType(node);
        
        // side effects!!! :-(
        this.constructors.push(node.constructor);
        this.types.push(newType);

        return newType;
      }
      inferType(node) {
        const name = node.constructor.name;
        return `PIXI.${name}`;
      }
}
