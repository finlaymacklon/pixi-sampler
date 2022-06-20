/**
 * Class for exposing the <canvas> objects representation (COR) of PixiJS-based applications
 */
export class PixiExposer {
    private isExposing: boolean;
    private isFreezing: boolean;
    private cor: Object; 
    private frozenCopiedCor: Object;
    private canvas: HTMLCanvasElement;
    //private resolution: number; 

    constructor() {
        this.isExposing = false; // set when we start exposing the scene graph
        this.isFreezing = false; // set when we (un-)freeze the renderer
        this.cor = {}; // set in the renderer's render function
        this.frozenCopiedCor = {}; // set when we poll the scene graph
        // @ts-ignore
        this.canvas = null; // set in the renderer's render function
        //this.resolution = 1; // set in the renderer's render function
    }
    /**
     * Inject the game renderer method with our tracking code
     */
    public expose() {
        // make sure PIXI actually exists in the global scope
        // @ts-ignore
        if (typeof PIXI === "undefined") {
            console.error("PIXI not found in global scope");
            return;
        }
        // use a distinct reference to PixiExposer object 
        // (to reduce confusion with PIXI.Renderer's this)
        const xpsr = this;
        // make sure we haven't already injected the code
        if (xpsr.isExposing === true) {
            console.warn("PixiExposer already injected");
            return;
        }
        // grab the renderer class from PIXI
        // @ts-ignore
        const Renderer = PIXI.Renderer;
        // grab original rendering function that PIXI uses
        const renderFunction = Renderer.prototype.render;
        // inject the tracking code into the rendering function
        // @ts-ignore
        Renderer.prototype.render = function (stage, ...args) {
            // prevent rendering when freezing animations
            if (xpsr.isFreezing)
                return;
            // use a distinct refernce to the Renderer object
            // (to reduce confusion with PixiExposer's this)
            const rndr = this;
            // apply the original rendering function
            renderFunction.apply(rndr, [stage, ...args]);
            // copy reference to the COR
            xpsr.cor = stage;
            // copy reference to the canvas
            xpsr.canvas = rndr.view;
            // copy the resolution of the renderer
            //xpsr.resolution = rndr.resolution;
        }
        // mark as injected
        xpsr.isExposing = true;
    }
    /**
     * Poll the scene graph for a frozen copy of the current COR
     */
    private corPoll(){
        return Object.freeze(Object.assign({}, this.cor));
    }
    /**
     * Freeze the renderer and the cor
     */
    public freeze(){        
        this.isFreezing = true;
        this.frozenCopiedCor = this.corPoll();
    }
    /**
     * Unfreeze the renderer
     */
    public unfreeze(){
        this.isFreezing = false;
        this.frozenCopiedCor = {};
    }
    /**
     * Serialize and return the frozen copied COR
     */
    public serialize(){
        // (Not yet) optimized serialization
        return JSON.stringify(this.frozenCopiedCor, this.getCircularReplacer())
    }
    //blobs.push(new Blob([JSON.stringify(this.frozenCopiedCor, getCircularReplacer())], { type: 'application/json' }))
    // maybe we should put the blobs in the local storage and download them later
    // or maybe we should pass the blobs (or strings) to a web worker which can do the IO seperately
    // or maybe we should open a websocket with the server and send the blobs
    // each blob is about 30MB, so we could find a way to compress these
    /**
     * Return a reference to the canvas
     */
    public getCanvas(){
        return this.canvas;
    }
    /**
     * Check if the renderer is frozen
     */
    public checkFrozen(){
        return this.isFreezing;
    }
    /**
     * Check if the renderer is exposed
     */
    public checkExposed(){
        return this.isExposing;
    }
    /**
     * Custom replacer function when serializing the COR
     * Remove all circular references
     */
    private getCircularReplacer(){
        const seen = new WeakSet();
        // @ts-ignore
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return;
                seen.add(value);
            }
            return value;
        };
    };
}
