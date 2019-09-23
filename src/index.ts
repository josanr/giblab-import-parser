import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import {parseString} from 'xml2js';


const FRONT = 0;
const RIGHT = 1;
const TOP = 2;
const LEFT = 3;
const BOTTOM = 4;
const BACK = 5;

export class GoodsSync {
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



const cncActs: { [s: string]: string } = {
    ms: "actions",
    ma: "actions",
    ml: "actions",
    mac: "actions",
    mf: "actions",
    ma3p: "actions",
};


class NotchItem {

    private depth: number;
    private indent: number;
    private width: number;
    private face: boolean;
    private byLength: boolean;

    constructor(
        depth: number,
        indent: number,
        width: number,
        face: boolean,
        byLength: boolean
    ) {
        this.depth = depth;
        this.indent = indent;
        this.width = width;
        this.face = face;
        this.byLength = byLength;
    }
}

export interface PartList { [key: number]: Part; }


export class Part {
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
    CncExtra:  Array<CncItem> = [];
    NotchExtra: Array<NotchItem> = [];
}

class CncItem {
    x: number;
    y: number;
    pathCenter: number;
    depth: number;
    type: string;

    constructor(x: number, y: number, pathCenter: number, depth: number) {
        this.x = x;
        this.y = y;
        this.pathCenter = pathCenter;
        this.depth = depth;
        this.type = "none";
    }
}


class StartPoint extends CncItem {
    inType: number;
    outType: number;

    constructor(x: number, y: number, pathCenter: number, depth: number, inType: number, outType: number) {
        super(x, y, pathCenter, depth);
        this.inType = inType;
        this.outType = outType;
        this.type = "StartPoint";
    }
}

class Arc extends CncItem {
    radius: number;
    direction: boolean;

    constructor(x: number, y: number, pathCenter: number, depth: number, radius: number, direction: boolean) {
        super(x, y, pathCenter, depth);
        this.radius = radius;
        this.direction = direction;
        this.type = "Arc";
    }
}

class Line extends CncItem {

    constructor(x: number, y: number, pathCenter: number, depth: number) {
        super(x, y, pathCenter, depth);
        this.type = "Line";
    }
}

class EndPointArc extends Arc {
    centerX: number;
    centerY: number;

    constructor(x: number, y: number, pathCenter: number, depth: number, direction: boolean, centerX: number, centerY: number) {
        super(x, y, pathCenter, depth, 0, direction);
        this.centerX = centerX;
        this.centerY = centerY;
        this.type = "EndPointArc";
    }
}

class GibLabParser {
    private basePath: string;
    private goodsSyncList: Map<number, GoodsSync>;
    private partsList: PartList;
    private error : Error;
    private warning: Array<Error>;
    constructor() {
        this.basePath = "/project";
        this.goodsSyncList = new Map();
        this.partsList = {};
        this.error = null;
        this.warning = [];
    }
    getSpec() : PartList
    {
        return this.partsList;
    }

    getGoodSync() : Map<number, GoodsSync>
    {
        return this.goodsSyncList;
    }
    getWarnings() : Array<Error>{
        return this.warning;
    }

    run(filePath: string, callback: (error: Error, partList: PartList , goodsSync: Map<number, GoodsSync>) => void) {
        let filestring = iconv.decode(fs.readFileSync(filePath), 'win1251');
        this.goodsSyncList = new Map();
        this.partsList = {};
        parseString(filestring, {explicitArray: false, mergeAttrs: true}, (err, data) => {
            this.getGoodsInExport(data);

            this.inflatePartsList(data);

            this.inflateDrillXNC(data);

            this.inflateNotchXNC(data);

            this.inflateCNC(data);

            callback(this.error, this.getSpec(), this.getGoodSync())
        });
    }

    parse(xmlString: string, callback: (error: Error, partList: PartList , goodsSync: Map<number, GoodsSync>) => void) {
        this.goodsSyncList = new Map();
        this.partsList = {};
        parseString(xmlString, {explicitArray: false, mergeAttrs: true}, (err, data) => {
            this.getGoodsInExport(data);

            this.inflatePartsList(data);

            this.inflateDrillXNC(data);

            this.inflateNotchXNC(data);

            this.inflateCNC(data);

            callback(this.error, this.getSpec(), this.getGoodSync())
        });
    }

    private inflateCNC(data: any) {
        for (let idx in data.project.operation) {
            const operation = data.project.operation[idx];
            if (operation.typeId !== 'XNC') {
                continue;
            }
            const partId = +operation.part.id;
            const part = this.partsList[partId];
            const lines = operation.program.split("><");
            let dx: number;
            let dy: number;
            let dz: number;

            for (const lid in lines) {
                const line = lines[lid];
                const lineParts = line.split(" ");
                if (lineParts[0] !== undefined && lineParts[0] === 'program') {
                    for (const lp in lineParts) {
                        const linePart = lineParts[lp];
                        if (linePart.split("=")[0].trim() === 'dx') {
                            dx = linePart.split("=")[1].split('"')[1].trim();
                        }

                        if (linePart.split("=")[0].trim() === 'dy') {
                            dy = linePart.split("=")[1].split('"')[1].trim();
                        }
                        if (linePart.split("=")[0].trim() === 'dz') {
                            dz = linePart.split("=")[1].split('"')[1].trim();
                        }
                    }
                }
            }

            const variables: { [key: string]: number } = {};
            for (const lid in lines) {
                const line = lines[lid];
                const lineParts = line.split(" ");
                if (lineParts[0] !== undefined && lineParts[0] === 'var') {

                    let key = null;
                    let value = null;
                    for (const lp in lineParts) {
                        const linePart = lineParts[lp];
                        if (linePart.split("=")[0].trim() === 'name') {
                            key = linePart.split("=")[1].split('"')[1].trim();
                        }

                        if (linePart.split("=")[0].trim() === 'expr') {
                            eval("value=+" + linePart.split("=")[1].split('"')[1].trim());

                        }
                    }
                    if (key !== null && value !== null) {
                        variables[key] = value;
                    }
                }
            }

            let pathCenter: number;
            let depth: number;

            for (const lid in lines) {
                const line = lines[lid];

                if (cncActs[line.split(" ")[0]] !== undefined) {
                    part.isCNC = true;

                    parseString("<" + line + ">", {explicitArray: false, mergeAttrs: true}, (err, result) => {
                        const itemType = Object.keys(result)[0];
                        let item: CncItem;

                        switch (itemType) {
                            case "ms":
                                pathCenter = variables[result["ms"].c] === undefined ? +result["ms"].c : variables[result["ms"].c];
                                depth = variables[result["ms"].dp] === undefined ? +result["ms"].dp : variables[result["ms"].dp];

                                item = new StartPoint(
                                    variables[result["ms"].x] === undefined ? +result["ms"].x : variables[result["ms"].x],
                                    variables[result["ms"].y] === undefined ? +result["ms"].y : variables[result["ms"].y],
                                    pathCenter,
                                    depth,
                                    0,
                                    0,
                                );

                                break;
                            case "ma":
                                item = new Arc(
                                    variables[result["ma"].x] === undefined ? +result["ma"].x : variables[result["ma"].x],
                                    variables[result["ma"].y] === undefined ? +result["ma"].y : variables[result["ma"].y],
                                    pathCenter,
                                    depth,
                                    variables[result["ma"].r] === undefined ? +result["ma"].r : variables[result["ma"].r],
                                    result["ma"].dir,
                                );

                                break;
                            case "ml":
                                item = new Line(
                                    variables[result["ml"].x] === undefined ? +result["ml"].x : variables[result["ml"].x],
                                    variables[result["ml"].y] === undefined ? +result["ml"].y : variables[result["ml"].y],
                                    pathCenter,
                                    depth,
                                );

                                break;
                            case "mac":
                                item = new EndPointArc(
                                    variables[result["mac"].x] === undefined ? +result["mac"].x : variables[result["mac"].x],
                                    variables[result["mac"].y] === undefined ? +result["mac"].y : variables[result["mac"].y],
                                    pathCenter,
                                    depth,
                                    result["mac"].dir,
                                    variables[result["mac"].cx] === undefined ? +result["mac"].cx : variables[result["mac"].cx],
                                    variables[result["mac"].cy] === undefined ? +result["mac"].cy : variables[result["mac"].cy]
                                );
                                break;
                            case "mf":
                                this.warning.push(new Error("rounding - not implemented"));
                                break;
                            case "ma3p":
                                this.warning.push(new Error("3point arc not implemented"));
                                break;
                        }
                        if (item !== undefined) {
                            part.CncExtra.push(item);
                        }


                    });
                }
            }
        }
    }

    private inflateNotchXNC(data: any) {
        for (let idx in data.project.operation) {
            const item = data.project.operation[idx];
            if (item.typeId !== 'XNC') {
                continue;
            }
            parseString(item.program, {explicitArray: false, mergeAttrs: true}, (err, result) => {
                const partId = +item.part.id;
                const part = this.partsList[partId];
                const program = result.program;
                if (program.gr === undefined) {
                    return;
                }
                part.isNotch = true;
                if (!Array.isArray(program.gr)) {
                    program.gr = [program.gr];
                }

                for (let idx in program.gr) {
                    const gr = program.gr[idx];
                    if (+gr.x1 !== +gr.x2 && +gr.y1 !== +gr.y2) {
                        this.warning.push(new Error("не линейный паз, пропускаем."));
                        continue;
                    }

                    let byLength = false;
                    let indent = +gr.y1;
                    if (+gr.x1 === +gr.x2) {
                        byLength = true;
                        indent = +gr.x1;
                    }
                    part.NotchExtra.push(new NotchItem(
                        +gr.dp,
                        indent,
                        +gr.t,
                        false,
                        byLength
                    ));
                }
            });

        }
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
                if (program.bf === undefined
                    && program.bb === undefined
                    && program.bt === undefined
                    && program.bl === undefined
                    && program.br === undefined
                ) {
                    return;
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
                if (partItem.elt !== undefined) {
                    let opId = partItem.elt.split("#")[1];
                    part.L1 = this.goodsSyncList.get(edgeOps[opId]).modelId;
                }
                if (partItem.elb !== undefined) {
                    let opId = partItem.elb.split("#")[1];
                    part.L2 = this.goodsSyncList.get(edgeOps[opId]).modelId;
                }
                if (partItem.ell !== undefined) {
                    let opId = partItem.ell.split("#")[1];
                    part.W1 = this.goodsSyncList.get(edgeOps[opId]).modelId;
                }
                if (partItem.elr !== undefined) {
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
