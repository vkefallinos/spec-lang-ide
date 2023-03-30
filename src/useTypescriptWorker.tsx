import { useEffect } from "react";
import { spec2ts } from "./utils";

export function useTypescriptWorker(
  isReady: any,
  sandpack: any,
  monaco: any,
  tsFile: string,
  code: string,
  sourceMapRef: any,
  tsModelRef: any,
  setIsReady: any,
  typescript: any,
  specModelRef: any,
  typescriptWorkerRef: any,
  typescriptRef: any
) {
  useEffect(() => {
    async function run() {
      if (isReady.monaco) {
        if (sandpack.activeFile.endsWith("spec")) {
          if (!monaco.editor.getModel(tsFile)) {
            const [ts, sourceMap] = spec2ts(code);
            sourceMapRef.current = sourceMap;

            tsModelRef.current = monaco.editor.createModel(
              ts,
              "typescript",
              tsFile
            );

            setIsReady((isReady) => ({ ...isReady, tsModel: true }));
            if (!typescriptRef.current) {
              function worker2(...uris1) {
                async function getTypeScriptWorker(...uris2) {
                  const tsWCall = await monaco.languages.typescript.getTypeScriptWorker(
                    ...uris2
                  );
                  const tsW = await tsWCall(...uris2);
                  const tsProxy = new Proxy(tsW, {
                    get(obj, key) {
                      if (key === "then") {
                        return tsProxy;
                      }
                      if (typeof tsW[key] === "function") {
                        return async (...args) => {
                          if (args[0] && args[0].endsWith(".spec")) {
                            args[0] = tsFile;
                            if (typeof args[1] === "number") {
                              let start = args[1];
                              const mapping = sourceMapRef.current[start];
                              if (mapping) {
                                args[1] = mapping;
                                const specPosition = specModelRef.current.getPositionAt(
                                  start
                                );
                                if (
                                  specPosition.lineNumber !==
                                  tsModelRef.current.getPositionAt(mapping)
                                    .lineNumber
                                ) {
                                  args[1] = tsModelRef.current.getOffsetAt(
                                    specPosition
                                  );
                                }
                              } else {
                                const pos = specModelRef.current.getPositionAt(
                                  args[1]
                                );
                                args[1] = tsModelRef.current.getOffsetAt(pos);
                              }
                            }
                            if (typeof args[2] === "number") {
                              let end = args[2];
                              const mapping = sourceMapRef.current[end];
                              if (mapping) {
                                args[2] = mapping;
                              } else {
                                const pos = specModelRef.current.getPositionAt(
                                  end
                                );
                                args[2] = tsModelRef.current.getOffsetAt(pos);

                                // debugger;
                              }
                            }
                          }
                          console.log("call:", key);

                          try {
                            const result = tsW[key](...args);
                            return result;
                          } catch (err) {
                            console.error(err);
                          }
                        };
                      }
                      return tsW[key];
                    }
                  });
                  return Promise.resolve(tsProxy);
                }
                return getTypeScriptWorker(...uris1);
              }

              typescriptWorkerRef.current = worker2;
              if (!typescriptRef.current) {
                monaco.languages.typescript.getTypeScriptWorker().then((w) => {
                  w().then(async (r) => {
                    typescriptRef.current = r;
                    console.log("files: ", await r.getScriptFileNames());
                    setIsReady((isReady) => ({ ...isReady, typescript: true }));
                  });
                });
              }
            }
          }
        }
      }
    }
    run();
  }, [isReady.monaco, isReady.typescript, sandpack.activeFile, tsFile]);
}
