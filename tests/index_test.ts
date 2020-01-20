import {GibLabParser, GoodsSync, Part, PartList} from "../src/index"
import { expect } from 'chai';
import 'mocha';
import * as fs from "fs";


describe('parse file', () => {

    it('Must contain right amount of materials and parts', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            expect(error).to.equal(null);
            expect(Object.keys(result).length).to.equal(141);
            expect(goodsSync.size).to.equal(5);
        });
        filePath = "./tests/test02.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            expect(error).to.equal(null);
            expect(Object.keys(result).length).to.equal(4);
            expect(goodsSync.size).to.equal(3);
        });

    });

    it('Test for cnc data', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test02.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            for(let idx in result){
                if(result[idx].isCNC === true){
                    expect(result[idx].CncExtra.length).not.to.equal(0);
                }
            }
        });


    });

    it('Test for Drill data', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test02.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            for(let idx in result){
                if(result[idx].isDrill === true){
                    expect(result[idx].DrillExtra.totalCount).not.to.equal(0);
                }
            }
        });


    });

    it('Test for Notch data not empty', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            for(let idx in result){
                if(result[idx].isNotch === true){
                    expect(result[idx].NotchExtra.length).not.to.equal(0);
                }
            }
        });


    });


    it('One element on map must not give error', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test03.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            expect(error).to.equal(null);
        });


    });


    it('Notch must be on right side', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            for(let idx in result){
                if(result[idx].isNotch === true && result[idx].pos === 4){
                    for(let nid in result[idx].NotchExtra){
                        expect(result[idx].NotchExtra[nid].getByLength()).to.equal(true);
                    }
                }
            }
        });


    });


    it('Notch is centered by tool in export it must be moved by left side', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            for(let idx in result){
                if(result[idx].isNotch === true && result[idx].pos === 4){
                    expect(result[idx].NotchExtra[0].getIndent()).to.equal(11);
                    expect(result[idx].NotchExtra[1].getIndent()).to.equal(128);
                }
            }
        });


    });


    it('GlueUp data', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test04.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            let part = result[1];
            expect(part.isGlue).to.equal(true);
            expect(part.GlueUpExtra.type).to.equal('self');
            expect(part.GlueUpExtra.out).to.equal(1);
            part = result[4];
            expect(part.isGlue).to.equal(true);
            expect(part.GlueUpExtra.type).to.equal('secondary');
            expect(part.GlueUpExtra.out).to.equal(0);
            part = result[5];
            expect(part.isGlue).to.equal(true);
            expect(part.GlueUpExtra.type).to.equal('perim');
            expect(part.GlueUpExtra.out).to.equal(1);
            expect(part.GlueUpExtra.absL1).to.equal(7);
            expect(part.GlueUpExtra.list).not.to.equal(0);
            console.log(result);
        });


    });


    it('Notch part side differentiation', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test04.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            let part = result[2];
            expect(part.isNotch).to.equal(true);
            expect(part.NotchExtra[0].getFace()).to.equal(true);
            expect(part.NotchExtra[1].getFace()).to.equal(false);
        });
    });


    it('Drill side selected by XNC', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test04.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            let part = result[2];
            expect(part.isDrill).to.equal(true);
            expect(part.DrillExtra.totalCount).to.equal(7);
            expect(part.DrillExtra.countByDiam[8]).to.equal(3);
            expect(part.DrillExtra.items[6].side).to.equal(5);

        });
    });

    it('Drill extra must not contain NaN', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            for(let idx in result){
                if(result[idx].isDrill === true){
                    for(let did in result[idx].DrillExtra.items){
                        const item = result[idx].DrillExtra.items[did];
                        expect(isNaN(item.side)).to.equal(false);
                        expect(isNaN(item.repeatType)).to.equal(false);
                        expect(isNaN(item.repDX)).to.equal(false);
                        expect(isNaN(item.repDy)).to.equal(false);
                        expect(isNaN(item.repCount)).to.equal(false);
                        expect(isNaN(item.directionX)).to.equal(false);
                        expect(isNaN(item.directionZ)).to.equal(false);
                        expect(isNaN(item.x)).to.equal(false);
                        expect(isNaN(item.y)).to.equal(false);
                        expect(isNaN(item.z)).to.equal(false);
                        expect(isNaN(item.depth)).to.equal(false);
                        expect(isNaN(item.diameter)).to.equal(false);
                    }

                }
            }
        });
        filePath = "./tests/test02.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            for(let idx in result){
                if(result[idx].isDrill === true){
                    for(let did in result[idx].DrillExtra.items){
                        const item = result[idx].DrillExtra.items[did];
                        expect(isNaN(item.side)).to.equal(false);
                        expect(isNaN(item.repeatType)).to.equal(false);
                        expect(isNaN(item.repDX)).to.equal(false);
                        expect(isNaN(item.repDy)).to.equal(false);
                        expect(isNaN(item.repCount)).to.equal(false);
                        expect(isNaN(item.directionX)).to.equal(false);
                        expect(isNaN(item.directionZ)).to.equal(false);
                        expect(isNaN(item.x)).to.equal(false);
                        expect(isNaN(item.y)).to.equal(false);
                        expect(isNaN(item.z)).to.equal(false);
                        expect(isNaN(item.depth)).to.equal(false);
                        expect(isNaN(item.diameter)).to.equal(false);
                    }

                }
            }
        });
        filePath = "./tests/test03.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            for(let idx in result){
                if(result[idx].isDrill === true){
                    for(let did in result[idx].DrillExtra.items){
                        const item = result[idx].DrillExtra.items[did];
                        expect(isNaN(item.side)).to.equal(false);
                        expect(isNaN(item.repeatType)).to.equal(false);
                        expect(isNaN(item.repDX)).to.equal(false);
                        expect(isNaN(item.repDy)).to.equal(false);
                        expect(isNaN(item.repCount)).to.equal(false);
                        expect(isNaN(item.directionX)).to.equal(false);
                        expect(isNaN(item.directionZ)).to.equal(false);
                        expect(isNaN(item.x)).to.equal(false);
                        expect(isNaN(item.y)).to.equal(false);
                        expect(isNaN(item.z)).to.equal(false);
                        expect(isNaN(item.depth)).to.equal(false);
                        expect(isNaN(item.diameter)).to.equal(false);
                    }

                }
            }
        });
        filePath = "./tests/test04.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            for(let idx in result){
                if(result[idx].isDrill === true){
                    for(let did in result[idx].DrillExtra.items){
                        const item = result[idx].DrillExtra.items[did];
                        expect(isNaN(item.side)).to.equal(false);
                        expect(isNaN(item.repeatType)).to.equal(false);
                        expect(isNaN(item.repDX)).to.equal(false);
                        expect(isNaN(item.repDy)).to.equal(false);
                        expect(isNaN(item.repCount)).to.equal(false);
                        expect(isNaN(item.directionX)).to.equal(false);
                        expect(isNaN(item.directionZ)).to.equal(false);
                        expect(isNaN(item.x)).to.equal(false);
                        expect(isNaN(item.y)).to.equal(false);
                        expect(isNaN(item.z)).to.equal(false);
                        expect(isNaN(item.depth)).to.equal(false);
                        expect(isNaN(item.diameter)).to.equal(false);
                    }

                }
            }
        });
    });


    it('Single item Import', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test05.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            expect(Object.keys(result).length).to.equal(1);
        });
    });


    it('Empty cut operation must not give error', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test06.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            expect(Object.keys(result).length).to.equal(60);
        });


    });


    it('Single operation must be parsed correctly', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test07.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            for(let idx in result){
                expect(result[idx].gid).to.greaterThan(0);
            }
        });


    });
});
