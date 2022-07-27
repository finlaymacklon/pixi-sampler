import fs from 'fs-extra-promise';
import { Page, JSHandle } from '@playwright/test'

export class PixiExposerAPI {
    private readonly instanceName:string = '__PIXI_EXPOSER__';
    private readonly basePath:string = __dirname;
    private snapshotsPath:string;
    private page:Page;

    private constructor (page:Page, path:string) {
        this.page = page;
        this.snapshotsPath = path;
    }

    public async startExposing() {
        await this.injectScript();
        await this.exposePixi();
    }

    private async injectScript() {
        const scriptPath = `${this.basePath}/PixiExposer.js`;
        await this.page.addScriptTag({ 'path': scriptPath });
    }
    
    private async exposePixi() {
        const code = [
            `const ${this.instanceName} = new PixiExposer();`,
            `window.${this.instanceName} = ${this.instanceName};`,
            `${this.instanceName}.expose();`
        ].join('\n');
        await this.page.evaluate(code);
    }

    public async takeSnapshot(name:string, filterKeys?: Array<string>) {
        // set default for optional parameter
        if (typeof filterKeys === 'undefined')
            filterKeys = [];
        // grab reference to the canvas
        const canvas = await this.getCanvasHandle();
        // stop animations
        await this.freezeRenderer();
        // take screenshot
        // @ts-ignore
        await canvas.screenshot({ path: `${this.snapshotsPath}/${name}.png` });
        // grab reference to scene graph
        const sceneGraphHandle = await this.getSceneGraphHandle(filterKeys);
        // read the scene graph
        const sceneGraph = await sceneGraphHandle.jsonValue();
        // re-start animations
        await this.unfreezeRenderer();
        // save the scene graph
        // @ts-ignore
        await this.saveSceneGraph(sceneGraph, `${this.snapshotsPath}/${name}.json`);
    }

    private async freezeRenderer() {
        const code = `${this.instanceName}.freeze();`
        await this.page.evaluate(code);
    }

    private async unfreezeRenderer() {
        const code = `${this.instanceName}.unfreeze();`
        await this.page.evaluate(code);
    }

    private async getCanvasHandle(): Promise<JSHandle> {
        const code = `${this.instanceName}.getCanvas();`
        return await this.page.evaluateHandle(code);
    }

    private async getSceneGraphHandle(filterKeys: Array<string>): Promise<JSHandle> {
        const filterKeyString = await this.getFilterKeysString(filterKeys);
        // serialize the Scene Graph, filter out specified keys while serializing
        const code = `${this.instanceName}.serialize(${filterKeyString});`
        return await this.page.evaluateHandle(code);
    }

    private async getFilterKeysString(filterKeys: Array<string>): Promise<string> {
        if (filterKeys.length === 0) 
            return "[]";
        // construct string of filterKeys array for executing in client
        const initialString = "[";
        const idxFinal = filterKeys.length - 1;
        return filterKeys.reduce(
            (prev:string, curr:string, idx:number): string => {
                if (idx === idxFinal)
                    return prev + `'${curr}']`
                return prev + `'${curr}', `;
            }, 
            initialString);
    }

    private async saveSceneGraph(corString:string, path:string) {
        await fs.writeFileAsync(path, corString);
    }
}