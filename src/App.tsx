import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackFileExplorer
} from "@codesandbox/sandpack-react";

import { Editor } from "./Editor";
import code from "./code";
import { useMonaco } from "@monaco-editor/react";
import { spec2ts } from "./utils";
import { editor, Uri } from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { TypeScriptWorker } from "./types";
import { registerProviders } from "./utils";
import { typescriptDefaults } from "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import { DiagnosticsAdapter } from "./languageFeatures";

const testFiles = {
  "/tsconfig.json": {
    code: `{
    "compilerOptions": {
      "strict": true,
      "module": "commonjs",
      "esModuleInterop": true,
      "allowJs": true,
      "lib": [

      ],
      "baseUrl": ".",
      "paths": {
        "@/*": ["./*"]
      },
      "rootDir": ".",
      "moduleResolution": "node"
    }
  }`
  },
  "/ypdil.spec": {
    code
  },
  "/common.spec": {
    code: `.ComponentStringDisplay[type] {
  /**
  * The component string has been used everywhere.
  */
  component: #'string';
  title: #string;
  .params {
    safe: #boolean;
  }
}

.ComponentDateDisplay[type] {
  component: #'date';
  title: #string;
  .params? {
    before?: #number;
  }
}

.TemplateType[type] {
  .steps {
    * {
      display: #ComponentStringDisplay | ComponentDateDisplay;
      /**
      * The order of actions appearance in the web version.
      */
      action-order: #string;
      fieldset-order: #string;
      
    }
  }
  /**
  * The order of all possible steps in the template.
  */
  steps-order: #string;
}`
  }
};

function transformPos(pos: number, spec: any) {
  if (spec.sourceMap[pos]) {
    return spec.sourceMap[pos];
  } else {
    const posCoords = spec.specModel.getPositionAt(pos);
    return spec.tsModel.getOffsetAt(posCoords);
  }
}

function transformObject(obj, sourceMap) {
  if (typeof obj === "number") {
  }
}
const proxifyWorkerPromise = (worker: TypeScriptWorker, files: any) => {
  return async () => {
    const proxy: any = new Proxy(worker, {
      get(obj, key: keyof TypeScriptWorker) {
        if (key === "then") {
          return proxy;
        }
        if (typeof worker[key] === "function") {
          return async (path: string, ...args) => {
            const tsPath = path.endsWith(".ts") ? path : `${path}.ts`;
            const newArgs = [`${tsPath}`];
            const cleanPath = path.replace("file://", "");
            const specFile = files[cleanPath];
            if (specFile) {
              for (let pos of args) {
                if (typeof pos === "number") {
                  const mapping = specFile.sourceMap[pos];
                  if (mapping) {
                    newArgs.push(mapping);
                  } else {
                    const posCoords = specFile.specModel.getPositionAt(pos);
                    if (
                      posCoords.lineNumber !==
                      specFile.tsModel.getPositionAt(mapping).lineNumber
                    ) {
                      newArgs.push(specFile.tsModel.getOffsetAt(posCoords));
                    } else {
                      newArgs.push(specFile.tsModel.getOffsetAt(posCoords));
                    }
                  }
                } else {
                  newArgs.push(pos);
                }
              }
            } else {
              newArgs.push(...args);
            }

            try {
              const result = await worker[key](...newArgs);
              console.log("Call:", key, result);
              if (Array.isArray(result)) {
                const newResult = result.map((r) => {
                  if (r?.file) {
                    r.file.fileName = r.file.fileName.replace(/\.ts$/, "");
                  }
                  if (r?.textSpan?.start) {
                    const transformed =
                      specFile.sourceMap.reverse[r.textSpan.start];
                    if (transformed) {
                      r.textSpan.start = transformed;
                    }
                  }
                  return r;
                });
                console.log(newResult, result);
              }
              return result;
            } catch (err) {
              console.error("Call failed:", key, err);
            }
          };
        }
        return worker[key];
      }
    });
    return proxy;
  };
};

async function initializeLang(
  monaco: Monaco,
  tsWorker: TypeScriptWorker,
  files: FilesState
) {
  //@ts-ignore
  const baseLang = await monaco.languages
    .getLanguages()
    .find((p) => p.id === "scss")
    //@ts-ignore
    .loader();
  // here is the monaco instance
  // do something before editor is mounted
  // const lang = merge(customTokenizer, baseLang.language);
  const lang = baseLang.language;
  monaco.languages.register({
    id: "spec",
    extensions: [".spec"],
    aliases: ["Spec", "sass", "scss"],
    mimetypes: ["text/x-spec", "text/spec"]
  });

  monaco.languages.setMonarchTokensProvider("spec", lang);

  const proxiedTsWorker = proxifyWorkerPromise(tsWorker, files);
  const { libFiles } = registerProviders(
    proxiedTsWorker,
    {},
    "spec",
    monaco.languages
  );
  const initializedDiagnostics = new DiagnosticsAdapter(
    libFiles,
    typescriptDefaults,
    "typescript",
    proxiedTsWorker,
    monaco.editor,
    (markers: editor.IMarkerData[], tsModel: editor.ITextModel) => {
      const { specModel, sourceMap } = files[
        tsModel.uri.toString().replace(/file:\/\/(.*?)\.ts$/, "$1")
      ];
      try {
        // ts model markers
        const updatedMarkers = markers.map((marker) => {
          const startColumn =
            sourceMap.lines[marker.startLineNumber].reverse[marker.startColumn];
          let endColumn =
            sourceMap.lines[marker.endLineNumber].reverse[marker.endColumn];
          if (!endColumn) {
            if (marker.startLineNumber === marker.endLineNumber) {
              endColumn = startColumn + (marker.endColumn - marker.startColumn);
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

        monaco.editor.setModelMarkers(specModel, "spec", updatedMarkers);
      } catch (err) {
        console.log("Error occurred at diagnostic marker sourceMapping ");
        console.log(err);
        console.log();
      }
    }
  );
  return initializedDiagnostics;
}
interface FileState {
  specUri: Uri;
  tsUri: Uri;
  specModel: editor.ITextModel;
  tsModel: editor.ITextModel;
  sourceMap: {
    [x: number]: number;
    reverse: {
      [x: number]: number;
    };
    lines: {
      [x: number]: {
        [x: number]: number;
        reverse: {
          [x: number]: number;
        };
      };
    };
  };
}
type FilesState = Record<string, FileState>;
const useSpecLang = async (
  monaco: Monaco | null,
  tsWorker: TypeScriptWorker | null,
  files: FilesState | null
) => {
  useEffect(() => {
    if (monaco && tsWorker && files) {
      initializeLang(monaco, tsWorker, files);
    }
  }, [monaco && tsWorker && files]);
};

const useTypescriptWorker = (monaco: Monaco | null) => {
  const [tsWorker, setTsWorker] = useState<TypeScriptWorker | null>(null);
  if (monaco && !tsWorker) {
    // we need this to register typescript
    const dummyModel = monaco.editor.createModel("", "typescript");
    dummyModel.dispose();
    monaco.languages.typescript.getTypeScriptWorker().then((w) => {
      w().then(async (worker) => {
        setTsWorker(worker);
      });
    });
  }
  return tsWorker;
};

const useFiles = (
  monaco: Monaco | null,
  files: Record<string, { code: string }>
) => {
  const [specFiles, setSpecFiles] = useState<FilesState | null>(null);
  if (monaco && !specFiles) {
    const newSpecFiles: any = {};
    for (const fileName in files) {
      const file = files[fileName];
      const specUri = Uri.parse(`file://${fileName}`);
      const tsUri = Uri.parse(`file://${fileName}.ts`);
      if (fileName.endsWith(".spec") && !monaco.editor.getModel(specUri)) {
        const specModel = monaco.editor.createModel(file.code, "spec", specUri);
        const [tsVersion, sourceMap] = spec2ts(file.code);
        const tsModel = monaco.editor.createModel(
          tsVersion,
          "typescript",
          tsUri
        );
        specModel.onDidChangeContent((diff) => {
          // diff.changes[0].range
          const [tsVersion, sourceMap] = spec2ts(specModel.getValue());
          newSpecFiles[fileName].sourceMap = sourceMap;
          tsModel.setValue(tsVersion);
        });
        // tsModel.onDidChangeContent((diff) => {
        // diff.changes[0].range
        // const [tsVersion, sourceMap] = spec2ts(specModel.getValue());
        // newSpecFiles[fileName].sourceMap = sourceMap;
        // tsModel.setValue(tsVersion);
        // });
        newSpecFiles[fileName] = {
          specUri,
          tsUri,
          specModel,
          tsModel,
          sourceMap
        };
      }
    }
    setSpecFiles(newSpecFiles);
  }

  return specFiles;
};

const App = () => {
  const monaco = useMonaco();

  const specFiles = useFiles(monaco, testFiles);
  const tsWorker = useTypescriptWorker(monaco);
  useSpecLang(monaco, tsWorker, specFiles);
  // window.files = specFiles;
  if (!specFiles) {
    return null;
  }
  // return <div>hello</div>;
  // console.log(uris);
  return (
    <SandpackProvider
      files={testFiles}
      customSetup={{
        dependencies: {
          typescript: "*"
        },
        entry: "/ypdil.spec"
      }}
      options={{
        visibleFiles: ["/ypdil.spec"],
        activeFile: "/ypdil.spec"
      }}
    >
      <SandpackLayout>
        <SandpackFileExplorer />
        <Editor />

        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={true}
          showNavigator={true}
          style={{ flex: "1" }}
        />
      </SandpackLayout>
    </SandpackProvider>
  );
};

export default App;
