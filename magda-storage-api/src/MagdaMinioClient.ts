import { Probe } from "magda-typescript-common/src/express/status";
import ObjectFromStore from "./ObjectFromStore";
import ObjectStoreClient from "./ObjectStoreClient";
import { Stream, Readable } from "stream";

import * as Minio from "minio";

export default class MagdaMinioClient implements ObjectStoreClient {
    private readonly bucket: string;
    private readonly client: any;

    constructor({ endPoint, port, useSSL, accessKey, secretKey, bucket }: any) {
        this.bucket = bucket;
        this.client = new Minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey
        });
    }

    readonly statusProbe: Probe = () => {
        return this.client.bucketExists(
            this.bucket,
            (err: boolean | null, exists: boolean) => {
                if (err) {
                    return Promise.resolve({
                        ready: false,
                        error: "Bucket Probe returned an error."
                    });
                }
                if (exists) {
                    return Promise.resolve({ ready: true });
                } else {
                    return Promise.resolve({
                        ready: false,
                        error: "Bucket does not exist."
                    });
                }
            }
        );
    };

    getFile(fileName: string): ObjectFromStore {
        const streamP = new Promise((resolve, reject) => {
            return this.client.getObject(
                this.bucket,
                fileName,
                (err: Error, dataStream: Stream) => {
                    if (err) {
                        return reject("Encountered Error while getting file");
                    }
                    return resolve(dataStream);
                }
            );
        });
        const statP = new Promise((resolve, reject) => {
            return this.client.statObject(
                this.bucket,
                fileName,
                (err: Error, stat: any) => {
                    if (err) {
                        reject(err);
                    }
                    return resolve(stat);
                }
            );
        });

        return {
            createStream() {
                return streamP.then((stream: any) => {
                    return stream;
                });
            },
            headers() {
                return statP.then((stat: any) =>
                    Promise.resolve({
                        "Content-Type": stat.metaData["content-type"],
                        "Content-Encoding": stat.metaData["content-encoding"],
                        "Cache-Control": stat.metaData["cache-control"],
                        "Content-Length": stat.size
                    })
                );
            }
        };
    }

    putFile(objectName: string, content: any, metaData?: object): Promise<any> {
        const contentSize = content.length;
        const contentStream = new Readable();

        /*  https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js/22085851#22085851
            (Update: in v0.10.26 through v9.2.1 so far, a call to push directly
            from the REPL prompt will crash with a not implemented exception
            if you didn't set _read. It won't crash inside a function or a script.
            If inconsistency makes you nervous, include the noop.)
        */
        // tldr; otherwise .push crashes in some versions of node with a 'not implemented' error
        contentStream._read = () => {};
        contentStream.push(content);
        contentStream.push(null);

        return new Promise((resolve, reject) => {
            return this.client.putObject(
                this.bucket,
                objectName,
                contentStream,
                contentSize,
                metaData,
                (err: Error, eTag: string) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(eTag);
                }
            );
        });
    }
}
