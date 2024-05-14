import { Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener"
import { Media } from "@capacitor-community/media"
import { dataURItoBlob } from "./downloader.js";
import { Browser } from '@capacitor/browser';

export async function openBlob(blob, filename = "rywl-file") {
    const { saveAs } = await import('file-saver')
    const writeBlob = (await import('capacitor-blob-writer')).default

    if (window.isNative) {
        const blo = await writeBlob({
            path: filename,
            directory: Directory.Cache,
            blob: blob
        })

        await FileOpener.open({
            filePath: blo
        })
    } else {
        saveAs(blob, filename);
    }
}

export async function openMedia(imgURL) {
    const { saveAs } = await import('file-saver')

    if (window.isNative) {
        const albums = await Media.getAlbums()
        const targetAlbum = albums.albums.find((e) => e.name == "Download").identifier

        const res = await Media.savePhoto({
            path: imgURL,
            albumIdentifier: targetAlbum
        })

        FileOpener.open({
            filePath: res.filePath
        })

    } else {
        saveAs(dataURItoBlob(imgURL), "rywl-out.jpg");
    }
}

export function rawToBlob(data, contentType) {
    return new Blob([data], {
        type: contentType
    })
}

export function openSite(url) {
    if (window.isNative) {
        Browser.open({ url });
    } else {
        window.open(url, "_blank")
    }
}