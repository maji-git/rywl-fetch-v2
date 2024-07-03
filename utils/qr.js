// __ Importing jimp __ \\
import Jimp from "jimp"

import fs from "fs"

import qrCodeReader from "qrcode-reader"

export async function readQR(buffer) {
    return new Promise((resolve, reject) => {
        // __ Parse the image using Jimp.read() __ \\
        Jimp.read(buffer, function (err, image) {
            if (err) {
                reject(err)
                return
            }
            // __ Creating an instance of qrcode-reader __ \\

            const qrCodeInstance = new qrCodeReader();

            qrCodeInstance.callback = function (err, value) {
                if (err) {
                    reject(err)
                    return
                }

                resolve(value.result)
            };

            // __ Decoding the QR code __ \\
            qrCodeInstance.decode(image.bitmap);
        });
    })
}