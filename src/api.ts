import fs from "fs-extra-promise";
import { Page } from '@playwright/test'
import { PixiExposer } from './PixiExposer';

export class PixiExposerAPI {
    private readonly instanceName:string = '__PIXI_EXPOSER__';
    private readonly basePath:string = __dirname;
    private page:Page;

    constructor (page:Page) {
        this.page = page;
    }

    public async startExposing(){
        await this.injectScript();
        await this.exposePixi();
    }

    private async injectScript() {
        const scriptPath = `${this.basePath}/${PixiExposer.name}.js`;
        await this.page.addScriptTag({ 'path': scriptPath });
    }
    
    private async exposePixi() {
        const code = [
            `const ${this.instanceName} = new ${PixiExposer.name}();`,
            `window.${this.instanceName} = ${this.instanceName};`,
            `${this.instanceName}.${PixiExposer.prototype.expose.name}();`
        ].join('\n');
        await this.page.evaluate(code);
    }

    public async takeSnapshot(name:string) {
        // grab reference to the canvas
        const canvas = await this.getCanvasHandle();
        // stop animations
        await this.freezeRenderer();
        // take screenshot
        // @ts-ignore
        await canvas.screenshot({ path: `${this.basePath}/${name}.png` });
        // grab reference to scene graph
        const sceneGraphHandle = await this.getSceneGraphHandle();
        // read the scene graph
        const sceneGraph = await sceneGraphHandle.jsonValue();
        // re-start animations
        await this.unfreezeRenderer();
        // save the scene graph
        // @ts-ignore
        await this.saveSceneGraph(sceneGraph, `${this.basePath}/${name}.json`);
    }

    private async freezeRenderer() {
        const code = `${this.instanceName}.${PixiExposer.prototype.freeze.name}();`
        await this.page.evaluate(code);
    }

    private async unfreezeRenderer() {
        const code = `${this.instanceName}.${PixiExposer.prototype.unfreeze.name}();`
        await this.page.evaluate(code);
    }

    private async getCanvasHandle() {
        const code = `${this.instanceName}.${PixiExposer.prototype.getCanvas.name}();`
        return await this.page.evaluateHandle(code);
    }

    private async getSceneGraphHandle() {
        const code = `${this.instanceName}.${PixiExposer.prototype.serialize.name}();`
        return await this.page.evaluateHandle(code);
    }

    private async saveSceneGraph(corString:string, path:string) {
        await fs.writeFileAsync(corString, path);
    }
}