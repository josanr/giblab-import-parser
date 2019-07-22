import {GibLabParser} from "../src/index"
import { expect } from 'chai';
import 'mocha';
import * as fs from "fs";

describe('parse file', () => {

    it('Should parse file givven in parameter', () => {
        let parser = new GibLabParser();
        let filePath = "./tests/test01.project";
        parser.run(filePath, (error: Error, result: any, goodSync: Array<string>) => {

        });


    });
});
