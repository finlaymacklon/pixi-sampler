/**
 * Class for exposing the <canvas> objects representation (COR) of PixiJS-based applications
 */
export class PixiExposer {
    constructor() {
        this.isInjected = false;
        this.isFreezing = false;
        this.cor = {};
        this.width = 0;
        this.height = 0;
        this.resolution = 1;
    }
    /**
     * Inject the game renderer method with our tracking code
     */
    inject() {
        // make sure PIXI actually exists in the global scope
        if (typeof PIXI === "undefined") {
            console.error("PIXI not found in global scope");
            return;
        }
        // use a distinct reference to PixiExposer object 
        // (to reduce confusion with PIXI.Renderer's this)
        const xpsr = this;
        // make sure we haven't already injected the code
        if (xpsr.isInjected === true) {
            console.warn("PixiExposer already injected");
            return;
        }
        // grab the renderer class from PIXI
        const Renderer = PIXI.Renderer;
        // grab original rendering function that PIXI uses
        const renderFunction = Renderer.prototype.render;
        // inject the tracking code into the rendering function
        Renderer.prototype.render = function (stage, ...args) {
            // prevent rendering when freezing animations
            if (xpsr.isFreezing)
                return;
            // use a distinct refernce to the Renderer object
            // (to reduce confusion with PixiExposer's this)
            const rndr = this;
            // apply the original rendering function
            renderFunction.apply(rndr, [stage, ...args]);
            // copy the COR
            xpsr.cor = stage;
            // copy the size of the canvas
            xpsr.width = rndr.view.width
            xpsr.height = rndr.view.height;
            // copy the resolution of the renderer
            xpsr.resolution = rndr.resolution;
        }
        // mark as injected
        xpsr.isInjected = true;
    }
    /**
     * Get and save blobs: the COR and a screenshot of the <canvas>
     */
    snapshot(){
        // stop rendering
        this.isFreezing = true;
        // get COR blob
        const corBlob = this.corshot();
        // get screenshot blob
        const screenshotBlob = this.screenshot();
        // restart rendering
        this.isFreezing = false;
        // save blobs
        this.saveBlob(corBlob, "cor.json");
        this.saveBlob(screenshotBlob, "screenshot.png");
        // delete blobs? or will they be collected because de-referenced?
        // ...
    }
    /**
     * Save a blob to a file
     */
    saveBlob(blob, fileName){
        return;
    }
    /**
     * Get a blob (JSON) of the current COR
     */
    corshot(){
        return;
    }
    /**
     * Get a blob (image) of a screenshot of the <canvas>
     */
    screenshot(){
        return;
    }
}
