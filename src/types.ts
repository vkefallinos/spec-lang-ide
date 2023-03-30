/**
 * A linked list of formatted diagnostic messages to be used as part of a multiline message.
 * It is built from the bottom up, leaving the head to be the "main" diagnostic.
 */
interface DiagnosticMessageChain {
  messageText: string;
  /** Diagnostic category: warning = 0, error = 1, suggestion = 2, message = 3 */
  category: 0 | 1 | 2 | 3;
  code: number;
  next?: DiagnosticMessageChain[];
}
export interface Diagnostic extends DiagnosticRelatedInformation {
  /** May store more in future. For now, this will simply be `true` to indicate when a diagnostic is an unused-identifier diagnostic. */
  reportsUnnecessary?: {};
  reportsDeprecated?: {};
  source?: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}
export interface DiagnosticRelatedInformation {
  /** Diagnostic category: warning = 0, error = 1, suggestion = 2, message = 3 */
  category: 0 | 1 | 2 | 3;
  code: number;
  /** TypeScriptWorker removes all but the `fileName` property to avoid serializing circular JSON structures. */
  file:
    | {
        fileName: string;
      }
    | undefined;
  start: number | undefined;
  length: number | undefined;
  messageText: string | DiagnosticMessageChain;
}
interface EmitOutput {
  outputFiles: OutputFile[];
  emitSkipped: boolean;
}
interface OutputFile {
  name: string;
  writeByteOrderMark: boolean;
  text: string;
}
export interface TypeScriptWorker {
  /**
   * Get diagnostic messages for any syntax issues in the given file.
   */
  getSyntacticDiagnostics(fileName: string): Promise<Diagnostic[]>;
  /**
   * Get diagnostic messages for any semantic issues in the given file.
   */
  getSemanticDiagnostics(fileName: string): Promise<Diagnostic[]>;
  /**
   * Get diagnostic messages for any suggestions related to the given file.
   */
  getSuggestionDiagnostics(fileName: string): Promise<Diagnostic[]>;
  /**
   * Get the content of a given file.
   */
  getScriptText(fileName: string): Promise<string | undefined>;
  /**
   * Get diagnostic messages related to the current compiler options.
   * @param fileName Not used
   */
  getCompilerOptionsDiagnostics(fileName: string): Promise<Diagnostic[]>;
  /**
   * Get code completions for the given file and position.
   * @returns `Promise<typescript.CompletionInfo | undefined>`
   */
  getCompletionsAtPosition(
    fileName: string,
    position: number
  ): Promise<any | undefined>;
  /**
   * Get code completion details for the given file, position, and entry.
   * @returns `Promise<typescript.CompletionEntryDetails | undefined>`
   */
  getCompletionEntryDetails(
    fileName: string,
    position: number,
    entry: string
  ): Promise<any | undefined>;
  /**
   * Get signature help items for the item at the given file and position.
   * @returns `Promise<typescript.SignatureHelpItems | undefined>`
   */
  getSignatureHelpItems(
    fileName: string,
    position: number,
    options: any
  ): Promise<any | undefined>;
  /**
   * Get quick info for the item at the given position in the file.
   * @returns `Promise<typescript.QuickInfo | undefined>`
   */
  getQuickInfoAtPosition(
    fileName: string,
    position: number
  ): Promise<any | undefined>;
  /**
   * Get other ranges which are related to the item at the given position in the file (often used for highlighting).
   * @returns `Promise<ReadonlyArray<typescript.ReferenceEntry> | undefined>`
   */
  getOccurrencesAtPosition(
    fileName: string,
    position: number
  ): Promise<ReadonlyArray<any> | undefined>;
  /**
   * Get the definition of the item at the given position in the file.
   * @returns `Promise<ReadonlyArray<typescript.DefinitionInfo> | undefined>`
   */
  getDefinitionAtPosition(
    fileName: string,
    position: number
  ): Promise<ReadonlyArray<any> | undefined>;
  /**
   * Get references to the item at the given position in the file.
   * @returns `Promise<typescript.ReferenceEntry[] | undefined>`
   */
  getReferencesAtPosition(
    fileName: string,
    position: number
  ): Promise<any[] | undefined>;
  /**
   * Get outline entries for the item at the given position in the file.
   * @returns `Promise<typescript.NavigationBarItem[]>`
   */
  getNavigationBarItems(fileName: string): Promise<any[]>;
  /**
   * Get changes which should be applied to format the given file.
   * @param options `typescript.FormatCodeOptions`
   * @returns `Promise<typescript.TextChange[]>`
   */
  getFormattingEditsForDocument(fileName: string, options: any): Promise<any[]>;
  /**
   * Get changes which should be applied to format the given range in the file.
   * @param options `typescript.FormatCodeOptions`
   * @returns `Promise<typescript.TextChange[]>`
   */
  getFormattingEditsForRange(
    fileName: string,
    start: number,
    end: number,
    options: any
  ): Promise<any[]>;
  /**
   * Get formatting changes which should be applied after the given keystroke.
   * @param options `typescript.FormatCodeOptions`
   * @returns `Promise<typescript.TextChange[]>`
   */
  getFormattingEditsAfterKeystroke(
    fileName: string,
    postion: number,
    ch: string,
    options: any
  ): Promise<any[]>;
  /**
   * Get other occurrences which should be updated when renaming the item at the given file and position.
   * @returns `Promise<readonly typescript.RenameLocation[] | undefined>`
   */
  findRenameLocations(
    fileName: string,
    positon: number,
    findInStrings: boolean,
    findInComments: boolean,
    providePrefixAndSuffixTextForRename: boolean
  ): Promise<readonly any[] | undefined>;
  /**
   * Get edits which should be applied to rename the item at the given file and position (or a failure reason).
   * @param options `typescript.RenameInfoOptions`
   * @returns `Promise<typescript.RenameInfo>`
   */
  getRenameInfo(fileName: string, positon: number, options: any): Promise<any>;
  /**
   * Get transpiled output for the given file.
   * @returns `typescript.EmitOutput`
   */
  getEmitOutput(fileName: string): Promise<EmitOutput>;
  /**
   * Get possible code fixes at the given position in the file.
   * @param formatOptions `typescript.FormatCodeOptions`
   * @returns `Promise<ReadonlyArray<typescript.CodeFixAction>>`
   */
  getCodeFixesAtPosition(
    fileName: string,
    start: number,
    end: number,
    errorCodes: number[],
    formatOptions: any
  ): Promise<ReadonlyArray<any>>;
  /**
   * Get inlay hints in the range of the file.
   * @param fileName
   * @returns `Promise<typescript.InlayHint[]>`
   */
  provideInlayHints(
    fileName: string,
    start: number,
    end: number
  ): Promise<ReadonlyArray<any>>;
}
