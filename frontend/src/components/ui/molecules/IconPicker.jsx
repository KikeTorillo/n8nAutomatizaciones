import { useState, useMemo, useCallback, memo } from 'react';
import {
  Search, X,
  // Productos y comercio
  Package, ShoppingCart, ShoppingBag, Store, Tag, Tags, Barcode, Box, Boxes,
  // Belleza y cuidado personal
  Scissors, Sparkles, Droplet, Droplets, Heart,
  // Alimentos y bebidas
  Coffee, UtensilsCrossed, Wine, Beer, Apple, Sandwich, Pizza, Cake,
  // Hogar y limpieza
  Home, Sofa, Lamp, Bed, Bath, Shirt,
  // Tecnología
  Laptop, Smartphone, Tablet, Monitor, Headphones, Camera, Printer, Cpu, HardDrive,
  // Herramientas
  Wrench, Hammer, Paintbrush, Ruler, Cog, Settings,
  // Salud y medicina
  Pill, Stethoscope, Syringe, Thermometer, Activity, HeartPulse,
  // Naturaleza y jardín
  Leaf, Flower, TreeDeciduous, Sun, Cloud, Umbrella,
  // Transporte
  Car, Truck, Bike, Plane,
  // Oficina y papelería
  FileText, Folder, ClipboardList, BookOpen, Pen, Pencil, Calculator,
  // Deporte y fitness
  Dumbbell, Trophy, Medal, Target,
  // Mascotas
  Dog, Cat, Bird, Fish,
  // Genéricos útiles
  Star, Circle, Square, Triangle, Hexagon, Diamond,
  Plus, Minus, Check, AlertCircle, Info, HelpCircle,
  Gift, Award, Crown, Gem, Zap, Flame, Snowflake,
  Music, Gamepad2, Puzzle, Palette,
  // Extras útiles
  Briefcase, Building, Building2, Users, User, UserCircle,
  Phone, Mail, MapPin, Clock, Calendar,
  Eye, EyeOff, Lock, Unlock, Key,
  Bell, BellRing, MessageSquare, Send,
  Download, Upload, RefreshCw, RotateCcw,
  ChevronRight, ChevronDown, ArrowRight, ArrowUp,
  MoreHorizontal, Menu, LayoutGrid, List,
  Bookmark, Flag, Hash, AtSign,
  Globe, Wifi, Bluetooth, Battery,
  Volume2, VolumeX, Play, Pause,
  Image, Film, Mic, Video,
} from 'lucide-react';

/**
 * Mapa de iconos disponibles con sus componentes
 */
const ICONOS_MAP = {
  // Productos y comercio
  Package, ShoppingCart, ShoppingBag, Store, Tag, Tags, Barcode, Box, Boxes,
  // Belleza y cuidado personal
  Scissors, Sparkles, Droplet, Droplets, Heart,
  // Alimentos y bebidas
  Coffee, UtensilsCrossed, Wine, Beer, Apple, Sandwich, Pizza, Cake,
  // Hogar y limpieza
  Home, Sofa, Lamp, Bed, Bath, Shirt,
  // Tecnología
  Laptop, Smartphone, Tablet, Monitor, Headphones, Camera, Printer, Cpu, HardDrive,
  // Herramientas
  Wrench, Hammer, Paintbrush, Ruler, Cog, Settings,
  // Salud y medicina
  Pill, Stethoscope, Syringe, Thermometer, Activity, HeartPulse,
  // Naturaleza y jardín
  Leaf, Flower, TreeDeciduous, Sun, Cloud, Umbrella,
  // Transporte
  Car, Truck, Bike, Plane,
  // Oficina y papelería
  FileText, Folder, ClipboardList, BookOpen, Pen, Pencil, Calculator,
  // Deporte y fitness
  Dumbbell, Trophy, Medal, Target,
  // Mascotas
  Dog, Cat, Bird, Fish,
  // Genéricos útiles
  Star, Circle, Square, Triangle, Hexagon, Diamond,
  Plus, Minus, Check, AlertCircle, Info, HelpCircle,
  Gift, Award, Crown, Gem, Zap, Flame, Snowflake,
  Music, Gamepad2, Puzzle, Palette,
  // Extras útiles
  Briefcase, Building, Building2, Users, User, UserCircle,
  Phone, Mail, MapPin, Clock, Calendar,
  Eye, EyeOff, Lock, Unlock, Key,
  Bell, BellRing, MessageSquare, Send,
  Download, Upload, RefreshCw, RotateCcw,
  ChevronRight, ChevronDown, ArrowRight, ArrowUp,
  MoreHorizontal, Menu, LayoutGrid, List,
  Bookmark, Flag, Hash, AtSign,
  Globe, Wifi, Bluetooth, Battery,
  Volume2, VolumeX, Play, Pause,
  Image, Film, Mic, Video,
};

/**
 * Categorías de iconos para organizar visualmente
 */
const CATEGORIAS_ICONOS = [
  {
    nombre: 'Comercio',
    iconos: ['Package', 'ShoppingCart', 'ShoppingBag', 'Store', 'Tag', 'Tags', 'Barcode', 'Box', 'Boxes', 'Briefcase']
  },
  {
    nombre: 'Belleza',
    iconos: ['Scissors', 'Sparkles', 'Droplet', 'Droplets', 'Heart']
  },
  {
    nombre: 'Alimentos',
    iconos: ['Coffee', 'UtensilsCrossed', 'Wine', 'Beer', 'Apple', 'Sandwich', 'Pizza', 'Cake']
  },
  {
    nombre: 'Hogar',
    iconos: ['Home', 'Sofa', 'Lamp', 'Bed', 'Bath', 'Shirt', 'Building', 'Building2']
  },
  {
    nombre: 'Tecnología',
    iconos: ['Laptop', 'Smartphone', 'Tablet', 'Monitor', 'Headphones', 'Camera', 'Printer', 'Cpu', 'HardDrive']
  },
  {
    nombre: 'Herramientas',
    iconos: ['Wrench', 'Hammer', 'Paintbrush', 'Ruler', 'Cog', 'Settings']
  },
  {
    nombre: 'Salud',
    iconos: ['Pill', 'Stethoscope', 'Syringe', 'Thermometer', 'Activity', 'HeartPulse']
  },
  {
    nombre: 'Naturaleza',
    iconos: ['Leaf', 'Flower', 'TreeDeciduous', 'Sun', 'Cloud', 'Umbrella']
  },
  {
    nombre: 'Transporte',
    iconos: ['Car', 'Truck', 'Bike', 'Plane']
  },
  {
    nombre: 'Oficina',
    iconos: ['FileText', 'Folder', 'ClipboardList', 'BookOpen', 'Pen', 'Pencil', 'Calculator']
  },
  {
    nombre: 'Deporte',
    iconos: ['Dumbbell', 'Trophy', 'Medal', 'Target']
  },
  {
    nombre: 'Mascotas',
    iconos: ['Dog', 'Cat', 'Bird', 'Fish']
  },
  {
    nombre: 'Personas',
    iconos: ['Users', 'User', 'UserCircle']
  },
  {
    nombre: 'Comunicación',
    iconos: ['Phone', 'Mail', 'MessageSquare', 'Send', 'Bell', 'BellRing']
  },
  {
    nombre: 'Media',
    iconos: ['Image', 'Film', 'Mic', 'Video', 'Music', 'Volume2', 'Play', 'Pause']
  },
  {
    nombre: 'Formas',
    iconos: ['Star', 'Circle', 'Square', 'Triangle', 'Hexagon', 'Diamond']
  },
  {
    nombre: 'General',
    iconos: ['Plus', 'Minus', 'Check', 'AlertCircle', 'Info', 'HelpCircle', 'Gift', 'Award', 'Crown', 'Gem', 'Zap', 'Flame', 'Snowflake', 'Gamepad2', 'Puzzle', 'Palette', 'Globe', 'MapPin', 'Clock', 'Calendar', 'Eye', 'Lock', 'Key', 'Bookmark', 'Flag']
  },
];

/**
 * Componente selector visual de iconos Lucide
 */
function IconPicker({ value, onChange, error }) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  // Lista plana de todos los iconos
  const todosLosIconos = Object.keys(ICONOS_MAP);

  // Filtrar iconos según búsqueda
  const iconosFiltrados = useMemo(() => {
    let lista = todosLosIconos;

    // Filtrar por categoría si está seleccionada
    if (categoriaActiva) {
      const cat = CATEGORIAS_ICONOS.find(c => c.nombre === categoriaActiva);
      if (cat) lista = cat.iconos.filter(i => ICONOS_MAP[i]); // Solo iconos que existan
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      lista = lista.filter(nombre => nombre.toLowerCase().includes(termino));
    }

    return lista;
  }, [busqueda, categoriaActiva, todosLosIconos]);

  // Renderizar icono (memoizado)
  const renderIcon = useCallback((nombreIcono, size = 20) => {
    const IconComponent = ICONOS_MAP[nombreIcono];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  }, []);

  const handleSelect = useCallback((nombreIcono) => {
    onChange(nombreIcono);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setBusqueda('');
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Icono seleccionado */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg text-primary-600 dark:text-primary-400">
            {renderIcon(value, 24)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Icono seleccionado</p>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-mono">{value}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800 rounded"
            title="Quitar icono"
            aria-label="Quitar icono seleccionado"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar icono..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Filtro por categorías */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCategoriaActiva(null)}
          className={`px-2 py-1 text-xs rounded-full transition-colors ${
            !categoriaActiva
              ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todos ({todosLosIconos.length})
        </button>
        {CATEGORIAS_ICONOS.map((cat) => (
          <button
            key={cat.nombre}
            type="button"
            onClick={() => setCategoriaActiva(cat.nombre)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              categoriaActiva === cat.nombre
                ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Grid de iconos */}
      <div className="max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
        {iconosFiltrados.length > 0 ? (
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
            {iconosFiltrados.map((nombreIcono) => (
              <IconButton
                key={nombreIcono}
                nombreIcono={nombreIcono}
                isSelected={value === nombreIcono}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            No se encontraron iconos con "{busqueda}"
          </p>
        )}
      </div>

      {/* Contador */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {iconosFiltrados.length} iconos {categoriaActiva ? `en ${categoriaActiva}` : 'disponibles'}
      </p>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/**
 * IconButton - Botón de icono memoizado
 */
const IconButton = memo(function IconButton({ nombreIcono, isSelected, onSelect }) {
  const IconComponent = ICONOS_MAP[nombreIcono];
  if (!IconComponent) return null;

  const handleClick = useCallback(() => {
    onSelect(nombreIcono);
  }, [onSelect, nombreIcono]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-2.5 rounded-lg transition-all flex items-center justify-center ${
        isSelected
          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}
      title={nombreIcono}
      aria-label={`Seleccionar icono ${nombreIcono}`}
    >
      <IconComponent size={20} />
    </button>
  );
});

export default IconPicker;
