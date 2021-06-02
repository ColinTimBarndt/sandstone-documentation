import React, { useState } from 'react'
import MonacoEditor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useComponentId } from '../utils/getUniqueId'


export function Editor({ onError, onReady, sandstoneFiles, value, setValue, height }: { sandstoneFiles: [content: string, fileName: string][], onError?: ((markers: editor.IMarker[]) => void), onReady?: (() => void), value: string, setValue: (value: string) => void, height: number }) {
  const currentEditorID = useComponentId()

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2016,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      typeRoots: ['node_modules/@types']
    })

    // Load Sandstone
    for (const [fileContent, fileName] of sandstoneFiles) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        fileContent,
        fileName,
      )
    }

    // Diagnostic Options
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    onReady?.()

    if (typeof onError !== 'undefined') {
      monaco.editor.onDidChangeMarkers(() => {
        onError(monaco.editor.getModelMarkers({ resource: new (monaco.Uri as any)('main.ts') }))
      })
    }

    const readonlyRange = new monaco.Range(0, 0, 4, 0)

    editor.onKeyDown(e => {
      // First, if the 1st line is selected, deselect it, since it's //@ts-ignore
      const primarySelection = editor.getSelection()
      if (primarySelection.startLineNumber === 1) {
        editor.setSelection(new monaco.Range(2, 0, primarySelection.endLineNumber, primarySelection.endColumn))
      }

      const contains = editor.getSelections().find(range => readonlyRange.intersectRanges(range)) !== undefined
      if (
        contains
        && (e.browserEvent.key.length === 1 || ['enter', 'backspace'].includes(e.browserEvent.key.toLowerCase()))
        && !(e.browserEvent.key.toLowerCase() === 'c' && e.ctrlKey) // Let Ctrl+C pass
      ) {
        e.stopPropagation()
        e.preventDefault()
        return
      }

      const backspaceContains = editor.getSelections().find(range => range.endLineNumber === 4 && range.endColumn === 1) !== undefined
      if (backspaceContains && e.browserEvent.key.toLowerCase() === 'backspace') {
        e.stopPropagation()
        return
      }
    });

    (editor as any).setHiddenAreas([new monaco.Range(0, 0, 1, 0)])
  }

  return (
    <>
      <p>{currentEditorID}</p>
      <MonacoEditor
        height={height}
        defaultLanguage="typescript"
        value={value}
        defaultPath={currentEditorID + "/main" + currentEditorID + ".ts"}
        theme="vs-dark"
        onChange={setValue}
        onMount={handleEditorDidMount}
        options={{
          folding: true,
          fontFamily: "var(--ifm-font-family-monospace)",
          fontLigatures: false,
          theme: 'vs-dark',
          tabCompletion: 'on',
          fontSize: 15.2,
          minimap: {
            enabled: false,
          },
          lineNumbers: 'off',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: {
            top: 18,
          },
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          }
        }}
      />
    </>
  )
}
