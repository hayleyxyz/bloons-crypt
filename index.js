#!/usr/bin/env node

const fs = require('fs');
const ArgumentParser = require('argparse').ArgumentParser;

class SaveFile {

    constructor(file) {
        
    }

    static decryptFile(file) {
        var data = fs.readFileSync(file);
        var encrypted = data.slice(SaveFile.headerSize);

        SaveFile.decrypt(encrypted, 0, encrypted.length);

        return encrypted;
    }

    static encryptFile(file) {
        var data = fs.readFileSync(file);
        var crc = SaveFile.formatCrc(SaveFile.calculateCrc(data));
        SaveFile.encrypt(data, 0, data.length);

        var buf = new Buffer(SaveFile.headerSize + data.length);

        buf.write(SaveFile.magic, 0);
        buf.write(crc, SaveFile.magic.length);
        data.copy(buf, SaveFile.headerSize);

        return buf;
    }

    static decrypt(data, start, length) {
        for(var i = 0; i < length; i++) {
            data[start + i] -= (i % 6) + 0x15;
        }
    }

    static encrypt(data, start, length) {
        for(var i = 0; i < length; i++) {
            data[start + i] += (i % 6) + 0x15;
        }
    }

    static calculateCrc(data) {
        var crc = 0;

        for(var i = 0; i < data.length; i++) {
            crc ^= data[i];
            var edx = (crc >>> 8);
            var eax = crc & 0xff;

            for(var x = 0; x < 8; x++) {
                if((eax & 1) == 1) {
                    eax = (eax >> 1);
                    eax ^= 0xEDB88320;
                }
                else {
                    eax = (eax >> 1);
                }
            }

            crc = eax ^ edx;
        }

        return (crc >>> 0);
    }

    // Convert to hex string and zero pad
    static formatCrc(crc) {
        var hex = crc.toString(16);
        var pad = '00000000';
        return (pad + hex).slice(-pad.length);
    }

    static get headerSize() {
        return SaveFile.magic.length + 8;
    }

    static get magic() {
        return 'DGDATA';
    }

}

var argParser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'osu-to-necro'
});

argParser.addArgument(
    [ '-a', '--action' ],
    {
        choices: [ 'decrypt', 'encrypt' ],
        required: true
    }
);

argParser.addArgument(
    [ '-o', '--output' ],
    {
        required: true
    }
);

argParser.addArgument(
    'file',
    {
    }
);

var args = argParser.parseArgs();

if(args.action === 'decrypt') {
    var data = SaveFile.decryptFile(args.file);
    fs.writeFileSync(args.output, data);
}
else if(args.action === 'encrypt') {
    var data = SaveFile.encryptFile(args.file);
    fs.writeFileSync(args.output, data);
}