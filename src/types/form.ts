import { Bot } from '../hooks/useBots';

// Field types
export type FieldType = 'text' | 'number' | 'number-prefix' | 'select' | 'duration-selector' | 'profit-threshold' | 'threshold-selector' | 'heading' | 'duration-selector-with-heading' | 'risk-management' | 'schedules' | 'switch-with-helper' | 'recovery-type' | 'cooldown-period' | 'max-trades-control' | 'trade-interval';
export type PrefixType = 'currency' | 'percentage' | 'multiplier';

// Tab configuration
export interface TabConfig {
  key: string;
  label: string;
  fields: FieldConfig[];
}

// Basic field configuration
export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  prefixType?: PrefixType; // For number-prefix fields
  options?: { value: string; label: string }[]; // For select fields
}

export interface FormConfig {
  fields?: FieldConfig[];
  tabs?: TabConfig[];
}

// Form values type
export interface StrategyFormProps {
  config?: FormConfig;
  strategyType: string;
  strategyId: string;
  tradeType?: string;
  onBack?: () => void;
  editBot?: Bot;
}

// Base form values that all forms can extend
export interface FormValues {
  [key: string]: string | number | object | boolean | undefined;
}
