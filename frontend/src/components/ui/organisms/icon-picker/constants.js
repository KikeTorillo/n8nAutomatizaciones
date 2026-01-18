/**
 * Constantes para IconPicker
 * Mapa de iconos y categorías organizadas
 */
import {
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
export const ICONOS_MAP = {
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
export const CATEGORIAS_ICONOS = [
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
