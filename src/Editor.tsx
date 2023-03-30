import {
  FileTabs,
  SandpackStack,
  useActiveCode,
  useSandpack
} from "@codesandbox/sandpack-react";
import MonacoEditor, { Monaco } from "@monaco-editor/react";
import { useRef, useState } from "react";
import { getLanguageOfFile } from "./utils";
import { useTypescriptWorker } from "./useTypescriptWorker";
import { useSpecTokenRegistration } from "./useSpecTokenRegistration";
import { useTsDiagnostics } from "./useTsDiagnostics";
import { useTsTranspilation } from "./useTsTranspilation";

export function Editor() {
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  // const [isReady, setIsReady] = useState<any>({});
  // const monacoRef = useRef(null);
  // //@ts-ignore
  // const monaco = monacoRef.current as Monaco;
  // const typescriptRef = useRef(null);
  // const typescript = typescriptRef.current as any;
  // const typescriptWorkerRef = useRef(null);
  // const tsModelRef = useRef();
  // const sourceMapRef = useRef();
  // const diagnosticsRef = useRef();

  // const tsModel = tsModelRef.current;
  // const specModelRef = useRef();
  const language = getLanguageOfFile(sandpack.activeFile);
  // const tsFile = `file://${sandpack.activeFile.replace(/\.spec$/, ".ts")}`;

  // useTypescriptWorker(
  //   isReady,
  //   sandpack,
  //   monaco,
  //   tsFile,
  //   code,
  //   sourceMapRef,
  //   tsModelRef,
  //   setIsReady,
  //   typescript,
  //   specModelRef,
  //   typescriptWorkerRef,
  //   typescriptRef
  // );
  // useSpecTokenRegistration(monaco, isReady);
  // useTsDiagnostics(
  //   isReady,
  //   typescriptWorkerRef,
  //   monaco,
  //   diagnosticsRef,
  //   monacoRef,
  //   specModelRef,
  //   tsModelRef,
  //   sourceMapRef
  // );
  // useTsTranspilation(isReady, code, tsModel, sourceMapRef, tsFile);

  // function setMonaco(monaco) {
  //   if (!isReady.monaco) {
  //     monacoRef.current = monaco;
  //     monaco.editor.onDidCreateModel((m) => {
  //       // debugger;
  //       console.log("create model", m.uri);
  //     });
  //     setIsReady((isReady) => ({ ...isReady, monaco: true }));
  //     // setTypescript(monaco);
  //   }
  // }

  // function setSpecModel(editor) {
  //   specModelRef.current = editor.getModel();
  //   console.log("setModel");
  //   setIsReady((isReady) => ({ ...isReady, specModel: true }));
  // }
  // async function debug() {
  //   console.log(
  //     { language, activeFile: sandpack.activeFile },
  //     await typescript?.getScriptFileNames(),
  //     typescript
  //   );
  // }
  // debug();
  let specUri = `file://${sandpack.activeFile}`;
  let tsUri = `file://${sandpack.activeFile}.ts`;

  return (
    <SandpackStack style={{ flex: "1", height: "100%", margin: 0 }}>
      <FileTabs />

      <MonacoEditor
        width="100%"
        height="100vh"
        language={language}
        theme="vs-dark"
        path={specUri}
        // beforeMount={setMonaco}
        // onMount={setSpecModel}
        // defaultValue={code}
        onChange={(value) => updateCode(value || "")}
        options={{
          wordBasedSuggestions: false
        }}
      />
      <MonacoEditor
        width="100%"
        height="100vh"
        language={"typescript"}
        theme="vs-dark"
        path={tsUri}
        options={{
          wordBasedSuggestions: false
        }}
      />
    </SandpackStack>
  );
}
