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


export {DrillPoint, DrillParsed}