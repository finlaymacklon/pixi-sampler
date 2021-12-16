/**
 * Modify PIXI's rendering method to track PIXI objects rendered to the <canvas>.
 * Whenever PIXI re-renders the stage using PIXI.Application.render(), find objects
 * that are renderable and visible, and add them to our list of tracked objects.
 * 
 * "Simple API that uses game framework to (de-)register game objects to/from a list"
 * 
 * Referenced https://github.com/bfanger/pixi-inspector/ 
 * TODO
 * - Maybe set upstream for TypeDetection.js to bfanger/pixi-inspector
 * 
 * @author Finlay Macklon
 */

import { TypeDetection } from "./TypeDetection";

/**
 * Class for accessing PIXI objects that are rendered to <canvas>
 */
export class PixiDebugger {
    constructor() {
        this.o = [];
        this.isInjected = false;
        this.typeDetection = new TypeDetection();
    }
    /**
     * Inject the game renderer method with our tracking code
     */
    inject() {
        if (!PIXI)
            return;
        if (this.isInjected) 
            return 0;
        const maxDepth = 2;
        // register the types present in global PIXI object
        this.typeDetection.registerTypes("PIXI.", PIXI, maxDepth);
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
    findVisibleObjects(parent) {
        if (!parent.type)
            parent.type = this.typeDetection.detectType(parent);
        // Currently think its a good idea not to track the Graphics or Container objects
        // ...because they are not really the game objects that we see on the <canvas>.
        if ((parent.type !== "PIXI.Graphics") && (parent.type !== "PIXI.Container") &&
            (parent.visible) && (parent.renderable))
            this.o.push(parent);
        if (parent.children)
            parent.children.map(c => this.findVisibleObjects(c));
    }
}
