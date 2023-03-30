import { useEffect } from "react";
import { spec2ts } from "./utils";

export function useTsTranspilation(
  isReady: any,
  code: string,
  tsModel: undefined,
  sourceMapRef: any,
  tsFile: string
) {
  useEffect(() => {
    async function run() {
      if (isReady.tsModel && isReady.specModel && isReady.typescript) {
        const [ts, sourceMap] = spec2ts(code);
        tsModel.setValue(ts);
        sourceMapRef.current = sourceMap;
      }
    }
    run();
  }, [isReady.tsModel, isReady.specModel, isReady.typescript, code, tsFile]);
}
