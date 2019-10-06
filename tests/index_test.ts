import {GibLabParser, GoodsSync, PartList} from "../src/index"
import { expect } from 'chai';
import 'mocha';
import * as fs from "fs";


describe('parse file', () => {

    it('Must contain right amount of materials and parts', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
            expect(error).to.equal(null);
            expect(Object.keys(result).length).to.equal(80);
            expect(goodsSync.size).to.equal(7);
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


    // it('XNC', () => {
    //     let parser = new GibLabParser();
    //     let filePath = "./tests/test01.project";
    //     parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {
    //
    //         console.log(JSON.stringify(result));
    //     });
    //
    //
    // });


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

        });


    });
});
