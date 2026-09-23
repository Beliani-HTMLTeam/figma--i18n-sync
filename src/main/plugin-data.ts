import { PLUGIN_DATA_KEYS } from "./constants";
import type { FrameConfig } from "./types";

type Codec<T> = {
  encode: (value: T) => string;
  decode: (raw: string) => T;
};

export type CloneMeta = {
  sourceId: string;
  locale: string;
};

const stringCodec: Codec<string> = {
  encode: (value) => value,
  decode: (raw) => raw,
};

const jsonCodec = <T>(): Codec<T> => ({
  encode: (value) => JSON.stringify(value),
  decode: (raw) => JSON.parse(raw) as T,
});

function createPluginDataStore<T>(key: string, codec: Codec<T>) {
  return {
    read(node: BaseNode): T | undefined {
      const raw = node.getPluginData(key);
      if (!raw) {
        return undefined;
      }
      try {
        return codec.decode(raw);
      } catch {
        return undefined;
      }
    },
    write(node: BaseNode, value: T): void {
      node.setPluginData(key, codec.encode(value));
    },
    clear(node: BaseNode): void {
      node.setPluginData(key, "");
    },
  };
}

export const frameConfigStore = createPluginDataStore(
  PLUGIN_DATA_KEYS.config,
  jsonCodec<Partial<FrameConfig>>(),
);

export const cloneSignatureStore = createPluginDataStore(
  PLUGIN_DATA_KEYS.signature,
  stringCodec,
);

export const cloneMetaStore = createPluginDataStore(
  PLUGIN_DATA_KEYS.clone,
  jsonCodec<CloneMeta>(),
);

export const isGeneratedClone = (node: BaseNode): boolean =>
  cloneMetaStore.read(node) !== undefined ||
  cloneSignatureStore.read(node) !== undefined;
