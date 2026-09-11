import React from 'react';
import {
  Film,
  Sparkles,
  Search,
  Star,
  Trash2,
  CheckCircle2,
  Check,
  PlusCircle,
  Plus,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  LogOut,
  Flame,
  TrendingUp,
  BarChart3,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP = {
  // Cinema & Mídia
  'film': Film,
  'film-outline': Film,
  'flame': Flame,
  'sparkles': Sparkles,
  'sparkles-outline': Sparkles,

  // Navegação e Ações
  'search': Search,
  'search-outline': Search,
  'star': Star,
  'trash-outline': Trash2,
  'trash': Trash2,
  'checkmark': Check,
  'checkmark-circle': CheckCircle2,
  'add': Plus,
  'add-circle-outline': PlusCircle,
  'close-circle': XCircle,

  // Autenticação & Usuário
  'mail-outline': Mail,
  'lock-closed-outline': Lock,
  'eye-outline': Eye,
  'eye-off-outline': EyeOff,
  'person-circle-outline': User,
  'log-out-outline': LogOut,

  // Informações & Gráficos
  'analytics': BarChart3,
  'trending-up': TrendingUp,
  'alert-circle': AlertCircle,
  'information-circle': Info,
};

export const Icon = ({ name, size = 20, color = '#FFFFFF', style = {} }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent size={size} color={color} style={style} />;
};

export default Icon;
