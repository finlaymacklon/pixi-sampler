"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixiExposerAPI = void 0;
const fs_extra_promise_1 = __importDefault(require("fs-extra-promise"));
class PixiExposerAPI {
    constructor(page, path) {
        this.instanceName = '__PIXI_EXPOSER__';
        this.basePath = __dirname;
        this.page = page;
        this.snapshotsPath = path;
    }
    startExposing() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.injectScript();
            yield this.exposePixi();
        });
    }
    injectScript() {
        return __awaiter(this, void 0, void 0, function* () {
            const scriptPath = `${this.basePath}/PixiExposer.js`;
            // await this.page.addScriptTag({ 'path': scriptPath, 'type': 'module' });
            yield this.page.addScriptTag({ 'path': scriptPath });
        });
    }
    exposePixi() {
        return __awaiter(this, void 0, void 0, function* () {
            const code = [
                `const ${this.instanceName} = new PixiExposer();`,
                `window.${this.instanceName} = ${this.instanceName};`,
                `${this.instanceName}.expose();`
            ].join('\n');
            yield this.page.evaluate(code);
        });
    }
    takeSnapshot(name) {
        return __awaiter(this, void 0, void 0, function* () {
            // grab reference to the canvas
            const canvas = yield this.getCanvasHandle();
            // stop animations
            yield this.freezeRenderer();
            // take screenshot
            // @ts-ignore
            yield canvas.screenshot({ path: `${this.snapshotsPath}/${name}.png` });
            // grab reference to scene graph
            const sceneGraphHandle = yield this.getSceneGraphHandle();
            // read the scene graph
            const sceneGraph = yield sceneGraphHandle.jsonValue();
            // re-start animations
            yield this.unfreezeRenderer();
            // save the scene graph
            // @ts-ignore
            yield this.saveSceneGraph(sceneGraph, `${this.snapshotsPath}/${name}.json`);
        });
    }
    freezeRenderer() {
        return __awaiter(this, void 0, void 0, function* () {
            const code = `${this.instanceName}.freeze();`;
            yield this.page.evaluate(code);
        });
    }
    unfreezeRenderer() {
        return __awaiter(this, void 0, void 0, function* () {
            const code = `${this.instanceName}.unfreeze();`;
            yield this.page.evaluate(code);
        });
    }
    getCanvasHandle() {
        return __awaiter(this, void 0, void 0, function* () {
            const code = `${this.instanceName}.getCanvas();`;
            return yield this.page.evaluateHandle(code);
        });
    }
    getSceneGraphHandle() {
        return __awaiter(this, void 0, void 0, function* () {
            const code = `${this.instanceName}.serialize();`;
            return yield this.page.evaluateHandle(code);
        });
    }
    saveSceneGraph(corString, path) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs_extra_promise_1.default.writeFileAsync(path, corString);
        });
    }
}
exports.PixiExposerAPI = PixiExposerAPI;
