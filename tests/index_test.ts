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


    it('XNC', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: PartList , goodsSync: Map<number, GoodsSync>) => {

            console.log(JSON.stringify(result));
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
});
