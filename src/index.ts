import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import {parseString} from 'xml2js';

class CncExtra {
}

class Part {
    gid: number;
    pos: number;
    modelIndex: number;
    id: number;
    length: number;
    width: number;
    num: number;
    comment: string;
    L1: number = 0;
    L2: number = 0;
    W1: number = 0;
    W2: number = 0;
    isNotch: boolean = false;
    isDrill: boolean = false;
    isGlue: boolean = false;
    isCNC: boolean = false;
    DrillExtra: DrillParsed;
    cncExtra: CncExtra;
}


class DrillParsed {
    totalCount: number = 0;
    countByDiam: { [key: number]: number } = {};
    items: Array<DrillPoint> = [];

    public add(point: DrillPoint) {
        this.totalCount++;
        if (this.countByDiam[point.diameter] === undefined) {
            this.countByDiam[point.diameter] = 0;
        }
        this.countByDiam[point.diameter]++;
        this.items.push(point);
    }


}

const FRONT = 0;
const RIGHT = 1;
const TOP = 2;
const LEFT = 3;
const BOTTOM = 4;
const BACK = 5;

class DrillPoint {
    type: string = "BV";
    /**
     * Тыл - 5
     * W1 - 3
     * L2 - 4
     * W2 - 1
     * L1 - 2
     * Лицо - 0
     */

    side: 0 | 1 | 2 | 3 | 4 | 5 = 0;
    corner: Array<number> = [];
    x: number;
    y: number;
    z: number;
    depth: number;
    diameter: number;
    repeatType: number = 0;
    repDX: number = 0;
    repDy: number = 0;
    repCount: number = 0;
    directionX: number = 0;
    directionY: number = 0;
    directionZ: number = 0;
}


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


class GibLabParser {
    private basePath: string;
    private goodsSyncList: Map<number, GoodsSync>;
    private partsList: { [s: number]: Part; } = {};

    constructor() {
        this.basePath = "/project";
        this.goodsSyncList = new Map();
    }


    run(filePath: string, callback: Function) {
        let filestring = iconv.decode(fs.readFileSync(filePath), 'win1251');
        parseString(filestring, {explicitArray: false, mergeAttrs: true}, (err, data) => {
            this.getGoodsInExport(data);

            this.inflatePartsList(data);

            this.inflateDrillXNC(data);


        });

    }

    private inflateDrillXNC(data: any) {
        for (let idx in data.project.operation) {
            const item = data.project.operation[idx];
            if (item.typeId !== 'XNC') {
                continue;
            }
            parseString(item.program, {explicitArray: false, mergeAttrs: true}, (err, result) => {
                const partId = +item.part.id;
                const part = this.partsList[partId];
                const program = result.program;
                let toolIndex: { [s: string]: number } = {};
                for (const idx in result.program.tool) {
                    toolIndex[program.tool[idx].name] = +program.tool[idx].d;
                }
                if (program.bf == undefined
                    && program.bb == undefined
                    && program.bt == undefined
                    && program.bl == undefined
                    && program.br == undefined
                ) {

                }
                part.isDrill = true;
                const drill = new DrillParsed();

                //drill face
                if (program.bf !== undefined) {
                    for (let idx in program.bf) {

                        const drillData = program.bf[idx];
                        const point = new DrillPoint();
                        point.side = FRONT;
                        point.x = +drillData.x;
                        point.y = +drillData.y;
                        point.z = 0;
                        point.depth = +drillData.dp;
                        point.diameter = toolIndex[drillData.name];
                        point.corner.push(1);
                        drill.add(point);
                    }

                }

                //drill left
                if (program.bl !== undefined) {
                    for (let idx in program.bl) {
                        const drillData = program.bl[idx];
                        const point = new DrillPoint();
                        point.type = "BH";
                        point.side = LEFT;
                        point.x = 0;
                        point.y = +drillData.y;
                        point.z = +drillData.z;
                        point.depth = +drillData.dp;
                        point.diameter = toolIndex[drillData.name];
                        point.corner.push(2);
                        drill.add(point);
                    }

                }

                //drill right
                if (program.br !== undefined) {
                    for (let idx in program.br) {
                        const drillData = program.br[idx];
                        const point = new DrillPoint();
                        point.type = "BH";
                        point.side = RIGHT;
                        point.x = +program.dx;
                        point.y = +drillData.y;
                        point.z = +drillData.z;
                        point.depth = +drillData.dp;
                        point.diameter = toolIndex[drillData.name];
                        point.corner.push(4);
                        drill.add(point);
                    }

                }

                //drill top
                if (program.bt !== undefined) {
                    for (let idx in program.bt) {
                        const drillData = program.bt[idx];
                        const point = new DrillPoint();
                        point.type = "BH";
                        point.side = TOP;
                        point.x = +drillData.x;
                        point.y = 0;
                        point.z = +drillData.z;
                        point.depth = +drillData.dp;
                        point.diameter = toolIndex[drillData.name];
                        point.corner.push(3);
                        drill.add(point);
                    }

                }

                //drill top
                if (program.bb !== undefined) {
                    for (let idx in program.bb) {
                        const drillData = program.bb[idx];
                        const point = new DrillPoint();
                        point.type = "BH";
                        point.side = BOTTOM;
                        point.x = +drillData.x;
                        point.y = +program.dy;
                        point.z = +drillData.z;
                        point.depth = +drillData.dp;
                        point.diameter = toolIndex[drillData.name];
                        point.corner.push(1);
                        drill.add(point);
                    }

                }

                part.DrillExtra = drill;
            });
        }
    }

    private inflatePartsList(data: any) {
        let edgeOps: { [s: string]: number; } = {};
        //getEdge Operation list
        for (let idx in data.project.operation) {
            const item = data.project.operation[idx];
            if (item.typeId !== 'EL') {
                continue;
            }
            edgeOps[item.id] = +item.material.id
        }

        for (let idx in data.project.good) {
            const item = data.project.good[idx];
            if (item.typeId !== 'product') {
                continue;
            }
            for (let pid in item.part) {
                let partItem = item.part[pid];
                let part = new Part();
                part.length = +partItem.dl;
                part.width = +partItem.dw;
                part.comment = partItem.name;
                part.pos = +partItem.id;
                part.num = +partItem.count;
                part.modelIndex = +partItem.code;
                if (partItem.elt != undefined) {
                    let opId = partItem.elt.split("#")[1];
                    part.L1 = this.goodsSyncList.get(edgeOps[opId]).modelId;
                }
                if (partItem.elb != undefined) {
                    let opId = partItem.elb.split("#")[1];
                    part.L2 = this.goodsSyncList.get(edgeOps[opId]).modelId;
                }
                if (partItem.ell != undefined) {
                    let opId = partItem.ell.split("#")[1];
                    part.W1 = this.goodsSyncList.get(edgeOps[opId]).modelId;
                }
                if (partItem.elr != undefined) {
                    let opId = partItem.elr.split("#")[1];
                    part.W2 = this.goodsSyncList.get(edgeOps[opId]).modelId;
                }

                this.partsList[part.pos] = part;
            }
        }

        for (let idx in data.project.operation) {
            const item = data.project.operation[idx];
            if (item.typeId !== 'CS') {
                continue;
            }

            let gid = this.goodsSyncList.get(+item.material.id).modelId;
            for (let pid in item.part) {
                let partid = item.part[pid].id;
                this.partsList[partid].gid = +gid;
            }
        }
    }

    private getGoodsInExport(data: any) {
        for (let idx in data.project.good) {
            const item = data.project.good[idx];
            if (item.typeId !== 'sheet' && item.typeId !== 'band') {
                continue;
            }
            this.goodsSyncList.set(+item.id, new GoodsSync(+item.id, item.name));
        }
    }
}


export {GibLabParser};
