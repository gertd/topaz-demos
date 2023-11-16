import { Importer } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_connect";
import { ImportRequest } from "@aserto/node-directory/src/gen/cjs/aserto/directory/importer/v3/importer_pb";
import { Reader } from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_connect";
import { createPromiseClient } from "@connectrpc/connect";
import { createAsyncIterable } from "@connectrpc/connect/protocol";
import { createGrpcTransport } from "@connectrpc/connect-node";

async function readAsyncIterable<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of gen) {
    out.push(x);
  }
  return out;
}

const grpcTansport = createGrpcTransport({
  httpVersion: "2",
  baseUrl: `https://localhost:9292`,
  nodeOptions: { rejectUnauthorized: false },
});

const reader = createPromiseClient(Reader, grpcTansport);

const client = createPromiseClient(Importer, grpcTansport);

reader
  .getObjects({
    objectType: "user",
    page: { size: 10 },
  })
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });

const importRequest = createAsyncIterable([
  new ImportRequest({
    msg: {
      case: "object",
      value: {
        id: "id1",
        type: "user",
        properties: {},
        displayName: "name1",
      },
    },
  }),
  new ImportRequest({
    msg: {
      case: "object",
      value: {
        id: "id2",
        type: "user",
        properties: {},
        displayName: "name2",
      },
    },
  }),
  new ImportRequest({
    msg: {
      case: "relation",
      value: {
        objectId: "id1",
        objectType: "user",
        subjectId: "id2",
        subjectType: "user",
        relation: "manager",
      },
    },
  }),
]);

const resp = client.import(importRequest);
Promise.resolve(readAsyncIterable(resp))
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });

reader
  .getObjects({
    objectType: "user",
    page: { size: 10 },
  })
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });
