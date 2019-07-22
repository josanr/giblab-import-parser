import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import {parseString} from 'xml2js';



class GibLabParser{
    private basePath: string;

    constructor() {
        this.basePath = "/project";
    }


    run(filePath: string, callback: Function) {
        let filestring = iconv.decode(fs.readFileSync(filePath), 'win1251');
        parseString(filestring, {explicitArray : false, mergeAttrs : true}, (err, data) => {
            console.log(data.project.good);
            // const containerQuant = +data.Проект.Изделие.Количество;
            //
            // this.parseNode(data.Проект.Изделие, containerQuant);
            //
            // callback(this.error, this.getSpec(), this.getGoodSync())

        });

    }
}


export {GibLabParser};
