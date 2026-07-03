export interface TemplateField {
  key: string;
  label: string;
  instruction: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  output: string;
}

export interface AppSettings {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  hotkey: string;
  selectedTemplateId: string;
  customTemplates: PromptTemplate[];
  builtInOverrides: Record<string, PromptTemplate>;
}
