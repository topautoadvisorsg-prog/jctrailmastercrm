import { type Monaco } from '@monaco-editor/react';
import { type editor } from 'monaco-editor';

type DisabledAutoTypingsOptions = {
  monaco: Monaco;
};

export const AutoTypings = {
  create: async (
    _editor: editor.IStandaloneCodeEditor,
    _options: DisabledAutoTypingsOptions,
  ) => undefined,
};
