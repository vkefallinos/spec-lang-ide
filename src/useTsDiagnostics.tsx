import { useEffect } from "react";
import { DiagnosticsAdapter } from "./languageFeatures";
import { registerProviders } from "./utils";
import { typescriptDefaults } from "monaco-editor/esm/vs/language/typescript/monaco.contribution";

export function useTsDiagnostics(
  isReady: any,
  typescriptWorkerRef: any,
  monaco: any,
  diagnosticsRef: any,
  monacoRef: any,
  specModelRef: any,
  tsModelRef: any,
  sourceMapRef: any
) {
  useEffect(() => {
    async function run() {
      if (isReady.typescript && !diagnosticsRef.current) {
        const { libFiles } = registerProviders(
          typescriptWorkerRef.current,
          {},
          "spec",
          monaco.languages
        );
        diagnosticsRef.current = new DiagnosticsAdapter(
          libFiles,
          typescriptDefaults,
          "typescript",
          typescriptWorkerRef.current,
          monacoRef.current.editor,
          tsModelRef.current,
          (markers) => {
            try {
              const updatedMarkers = markers.map((marker) => {
                const startColumn =
                  sourceMapRef.current.lines[marker.startLineNumber].reverse[
                    marker.startColumn
                  ];
                let endColumn =
                  sourceMapRef.current.lines[marker.endLineNumber].reverse[
                    marker.endColumn
                  ];
                if (!endColumn) {
                  if (marker.startLineNumber === marker.endLineNumber) {
                    endColumn =
                      startColumn + (marker.endColumn - marker.startColumn);
                  } else {
                    endColumn = startColumn + 1;
                  }
                }
                return {
                  ...marker,
                  startColumn,
                  endColumn
                };
              });
              monaco.editor.setModelMarkers(
                specModelRef.current,
                "spec",
                updatedMarkers
              );
            } catch (err) {}
          }
        );
        console.error(diagnosticsRef.current);
      }
    }
    run();
  }, [isReady.typescript]);
}
