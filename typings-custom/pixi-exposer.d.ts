declare module 'pixi-exposer-script' {
    export class PixiExposer {
        private isExposing: Boolean;
        private isFreezing: Boolean;
        private cor: Object; 
        private frozenCopiedCor: Object;
        private canvas: HTMLCanvasElement;
        public expose(): null;
        private corPoll(): Object;
        public freeze(): null;
        public unfreeze(): null;
        public serialize(): String;
        public getCanvas(): HTMLCanvasElement;
        public checkFrozen(): Boolean;
        public checkExposed(): Boolean;
        private getCircularReplacer(): Function;
    }
}