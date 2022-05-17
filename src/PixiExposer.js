/**
 * Class for exposing the <canvas> objects representation (COR) of PixiJS-based applications
 */
export class PixiExposer {
    constructor() {
        this.isInjected = false;
        this.isFreezing = false;
        this.cor = null;
        this.canvas = null;
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
            // copy reference to the COR
            xpsr.cor = stage;
            // copy reference to the canvas
            xpsr.canvas = rndr.view;
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
        const frozenCorBlob = this.corpoll();
        // get screenshot blob
        const screenshotBlob = this.screenshot();
        // restart rendering
        this.isFreezing = false;
        // save blobs
        this.saveBlob(frozenCorBlob, "cor.json");
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
     * Poll the scene graph for a blob (JSON) of the current COR
     */
     corpoll(){
        return Object.assign({}, this.cor);
    }
    /**
     * Get a blob (image) of a screenshot of the <canvas>
     */
    screenshot(){
        // strm = this.canvas.captureStream(60);
        // MediaStream {id: 'c95b5168-836d-4b23-85fc-dcd1145de217', active: true, onaddtrack: null, onremovetrack: null, onactive: null, …}
        // ic = new ImageCapture(strm.getTracks()[0])
        // ImageCapture {track: CanvasCaptureMediaStreamTrack}
        // ic.grabFrame()
        // Promise {<pending>}
        return;
    }
}
