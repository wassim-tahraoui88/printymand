interface SettingDefinition {
    key: string;
    type: 'number' | 'string' | 'boolean';
}

type SettingTypeDefinition = number | string | boolean;