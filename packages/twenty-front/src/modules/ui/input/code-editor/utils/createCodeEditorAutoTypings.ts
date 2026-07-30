import { type Monaco } from '@monaco-editor/react';
import { type editor } from 'monaco-editor';

type CreateCodeEditorAutoTypingsOptions = {
  editor: editor.IStandaloneCodeEditor;
  monaco: Monaco;
  versions: Record<string, string> | null | undefined;
};

export const createCodeEditorAutoTypings = async ({
  editor,
  monaco,
  versions,
}: CreateCodeEditorAutoTypingsOptions) => {
  if (import.meta.env.REACT_APP_ENABLE_CODE_EDITOR_AUTO_TYPINGS !== 'true') {
    return;
  }

  const { AutoTypings } = await import('monaco-editor-auto-typings');

  await AutoTypings.create(editor, {
    monaco,
    preloadPackages: true,
    onlySpecifiedPackages: true,
    versions: versions ?? {},
    debounceDuration: 0,
  });
};
