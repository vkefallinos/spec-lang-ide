import * as languageFeatures from "./languageFeatures";
import { typescriptDefaults } from "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import { SourceMapGenerator, SourceMapConsumer } from "source-map";
export const getLanguageOfFile = (filePath: string) => {
  const extensionDotIndex = filePath.lastIndexOf(".");
  const extension = filePath.slice(extensionDotIndex + 1);

  switch (extension) {
    case "spec":
      return "spec";
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return "javascript";
    case "vue":
    case "html":
      return "html";
    case "css":
    case "scss":
    case "less":
      return "css";
    default:
      return "javascript";
  }
};
const lexical = [
  {
    find: /^([ ]*)(\/\*\*)$/g,
    replace: "$1$2",
    type: "comment start"
  },
  {
    find: /^([ ]*\*) ([^{].*?)$/g,
    replace: "$1 $2",
    type: "comment body"
  },
  {
    find: /^([ ]*)(\*\/)$/g,
    replace: "$1$2",
    type: "comment end"
  },
  {
    find: /^([ \t]*)$/,
    replace: "$1",
    type: "spaces"
  },
  {
    find: /^@use ('.*?') as ([a-zA-Z0-9]*);$/g,
    replace: "import { $2 } from $1;",
    type: "import"
  },
  {
    find: /^(\$.*?): (.+);/g,
    replace: "const $1 = `$2`;",
    type: "var declaration"
  },
  {
    find: /^:export \.(.*?)\[type\] {/g,
    replace: "export interface $1 {",
    type: "export interface"
  },
  {
    find: /^\.(.*?)\[type\] {/g,
    replace: "export interface $1 {",
    type: "interface declaration"
  },
  {
    find: /^:export \.(.*?)\[([A-Z].*?)\] {/g,
    replace: "export const $1: $2 = {",
    type: "export object type declaration"
  },
  {
    find: /^:export \.(.*?) {/g,
    replace: "export const $1 = {",
    type: "export object declaration"
  },
  {
    find: /^\.(.*?)\[([A-Z].*?)\] {/g,
    replace: "export const $1: $2 = {",
    type: "object type declaration"
  },
  {
    find: /^\.(.*?) {/g,
    replace: "export const $1 = {",
    type: "object declaration"
  },
  {
    find: /\.(.*?)\? {/g,
    replace: "'$1'?: {",
    type: "key object optional type"
  },
  {
    find: /\.(.*?) {/g,
    replace: "'$1': {",
    type: "key object"
  },
  {
    find: /([ ]*)(.*?): (\$.*?);/g,
    replace: "$1'$2': $3,",
    type: "var value"
  },
  {
    find: /([ ]*)(.*?): ([1-9][0-9]+);/g,
    replace: "$1'$2': $3,",
    type: "key number value"
  },
  {
    find: /([ ]*)(.*?): (true|false);/g,
    replace: "$1'$2': $3,",
    type: "key boolean value"
  },
  {
    find: /([ ]*)(.*?)\?: #(.*?);/g,
    replace: "$1'$2'?: $3,",
    type: "key type optional value"
  },
  {
    find: /([ ]*)(.*?): #(.*?);/g,
    replace: "$1'$2': $3,",
    type: "key type value"
  },
  {
    find: /([ ]*)([a-zA-Z0-9-]+): ["'](.*?)["'];/g,
    replace: "$1'$2': '$3',",
    type: "key value with quote"
  },
  {
    find: /([ ]*)(.*?): ["'](.*?)["'];/g,
    replace: "$1$2: '$3',",
    type: "key value with quote"
  },
  {
    find: /([ ]*)([a-zA-Z0-9-]+): (.*?);/g,
    replace: "$1'$2': '$3',",
    type: "key value"
  },
  {
    find: /([ ]*)(.*?): (.*?);/g,
    replace: "$1$2: '$3',",
    type: "key value"
  },
  {
    find: /\[([A-Z].*?)\]/g,
    replace: ": $1",
    type: "type"
  },
  {
    find: /@include \.(.*?);/g,
    replace: "...$1,",
    type: "merge local object"
  },
  {
    find: /@include (.*?);/g,
    replace: "...$1,",
    type: "merge"
  },
  {
    find: /([ ]+})/g,
    replace: "$1,",
    type: "inner bracket comma"
  },
  {
    find: /\* {/g,
    replace: "[x:string]: {",
    type: "glob type"
  },
  {
    find: /(})/g,
    replace: "$1",
    type: "closing bracket"
  },
  {
    find: /(\.)([a-z0-9_-]*)[ {}]*/i,
    replace: "'$2': {},",
    type: "typing new key object"
  },
  {
    find: /([a-z0-9_-])*[ :,']*/i,
    replace: "'$2': ,",
    type: "typing new key value"
  }
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function transformLine(regex, replace, line) {
  const match = regex.exec(line).slice(1);

  const origMatchesPositions = match.map((str) => {
    const startIndex = line.match(new RegExp(escapeRegExp(str))).index;
    return {
      text: str,
      originalColumn: startIndex
    };
  });

  const transformedLine = line.replace(regex, replace);

  const positions = origMatchesPositions.map(({ text, ...m }) => {
    const transformedColumn = transformedLine.match(
      new RegExp(escapeRegExp(text))
    ).index;
    return {
      ...m,
      text,
      transformedColumn
    };
  });
  if (positions.length) {
    const sm = positions.reduce(
      (map, trans) => {
        for (
          let index = trans.originalColumn;
          index < trans.originalColumn + trans.text.length;
          index++
        ) {
          const targetColumn =
            trans.transformedColumn + (index - trans.originalColumn);
          map[index] = targetColumn;
          map.reverse[targetColumn] = index;
        }

        // // console.log(line.length, transformedLine.length);
        map.origLength = line ? line.length + 1 : 1;
        map.transLength = transformedLine ? transformedLine.length + 1 : 1;
        return map;
      },
      { reverse: {} }
    );
    return [transformedLine, sm];
  } else {
    return [
      transformedLine,
      {
        origLength: line.length,
        transLength: line.length
      }
    ];
  }
}

export function spec2ts(specText: string) {
  const sourceMap: any = {
    reverse: {},
    lines: []
  };
  let lastOrigIndex = 0;
  let lastTransIndex = 0;
  const ts = specText
    .split("\n")
    .map((line, index) => {
      const lineCount = index + 1;
      if (!line) {
        lastOrigIndex += 1;
        lastTransIndex += 1;
        // // console.log("te:", specText.slice(0, lastOrigIndex));

        return line;
      }
      const matchReplacer = lexical.find(({ find }) => {
        const match = line.match(find);
        return match;
      });
      if (matchReplacer) {
        const [newLine, sm] = transformLine(
          matchReplacer?.find,
          matchReplacer?.replace,
          line
        );
        for (let pos in sm) {
          pos = parseInt(pos);
          const i = pos + lastOrigIndex;
          const j = sm[pos] + lastTransIndex;
          sourceMap[i] = j;
          sourceMap.reverse[j] = i;
        }
        sourceMap.lines[lineCount] = sm;

        if (!sm.origLength) {
          debugger;
        }
        // // console.log("lengths", sm.origLength, sm.transLength);
        sm.origLength = sm.origLength || 0;
        sm.transLength = sm.transLength || 0;
        lastOrigIndex += sm.origLength;
        lastTransIndex += sm.transLength;
        // sourceMap.push(sm);
        // console.log("indexes", lastOrigIndex, lastTransIndex);
        // console.log("te:", specText.slice(0, lastOrigIndex));

        return newLine;
      }
      throw new Error(
        `line(${index}): '''${line}''' not handled by regex rules. `
      );
      return line;
    })
    .join("\n");

  // console.log("sm", sourceMap);
  return [ts, sourceMap];
}
export const libFileSet: Record<string, boolean> = {};
libFileSet["lib.d.ts"] = true;

export function registerProviders(
  worker: any,
  modeConfiguration: any,
  modeId: string,
  languages: any
): { libFiles: languageFeatures.LibFiles } {
  const libFiles = new languageFeatures.LibFiles(worker);

  languages.registerCompletionItemProvider(
    modeId,
    new languageFeatures.SuggestAdapter(worker)
  );
  languages.registerSignatureHelpProvider(
    modeId,
    new languageFeatures.SignatureHelpAdapter(worker)
  );
  languages.registerHoverProvider(
    modeId,
    new languageFeatures.QuickInfoAdapter(worker)
  );
  // languages.registerDocumentHighlightProvider(
  //   modeId,
  //   new languageFeatures.DocumentHighlightAdapter(worker)
  // );
  languages.registerDefinitionProvider(
    modeId,
    new languageFeatures.DefinitionAdapter(libFiles, worker)
  );
  languages.registerReferenceProvider(
    modeId,
    new languageFeatures.ReferenceAdapter(libFiles, worker)
  );

  languages.registerDocumentSymbolProvider(
    modeId,
    new languageFeatures.OutlineAdapter(worker)
  );
  languages.registerRenameProvider(
    modeId,
    new languageFeatures.RenameAdapter(libFiles, worker)
  );
  languages.registerDocumentRangeFormattingEditProvider(
    modeId,
    new languageFeatures.FormatAdapter(worker)
  );
  languages.registerOnTypeFormattingEditProvider(
    modeId,
    new languageFeatures.FormatOnTypeAdapter(worker)
  );
  languages.registerCodeActionProvider(
    modeId,
    new languageFeatures.CodeActionAdaptor(worker)
  );
  languages.registerInlayHintsProvider(
    modeId,
    new languageFeatures.InlayHintsAdapter(worker)
  );
  return { libFiles };
}
