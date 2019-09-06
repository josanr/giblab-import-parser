class GoodsSync {
    private readonly _modelName: string;
    private readonly _modelId: number;

    private _gid: number;

    constructor(modelId: number, modelName: string) {
        this._modelId = modelId;
        this._modelName = modelName;
        this._gid = 0;
    }

    get modelId(): number {
        return this._modelId;
    }

    get modelName(): string {
        return this._modelName;
    }

    get gid(): number {
        return this._gid;
    }

    set gid(value: number) {
        this._gid = value;
    }
}

export {GoodsSync}