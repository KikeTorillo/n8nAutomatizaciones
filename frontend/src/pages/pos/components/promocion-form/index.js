// Re-exports para promocion-form
export { default as PromocionFormGeneralTab } from './PromocionFormGeneralTab';
export { default as PromocionFormTipoTab } from './PromocionFormTipoTab';
export { default as PromocionFormCondicionesTab } from './PromocionFormCondicionesTab';

export {
  TIPOS_PROMOCION,
  DIAS_SEMANA,
  promocionCreateSchema,
  promocionEditSchema,
  defaultValuesCreate,
  getDefaultValuesEdit,
  transformFormToPayload,
} from './schemas';
