// Schemas de validación Zod
export {
  productoCreateSchema,
  productoEditSchema,
  defaultValuesCreate,
  getDefaultValuesEdit,
} from './schemas';

// Tabs del formulario
export { default as ProductoFormGeneralTab } from './ProductoFormGeneralTab';
export { default as ProductoFormPreciosTab } from './ProductoFormPreciosTab';
export { default as ProductoFormInventarioTab } from './ProductoFormInventarioTab';
export { default as ProductoFormConfigTab } from './ProductoFormConfigTab';
