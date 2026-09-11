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
  Clock,
  Calendar,
  Play,
  X,
  ExternalLink,
  PieChart,
  Award,
  Trophy,
  Tv,
  Compass,
  Activity,
  Zap,
} from 'lucide-react';

const ICON_MAP = {
  // Cinema & Mídia
  'film': Film,
  'film-outline': Film,
  'flame': Flame,
  'sparkles': Sparkles,
  'sparkles-outline': Sparkles,
  'play': Play,
  'play-circle': Play,
  'tv': Tv,

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
  'close': X,
  'external-link': ExternalLink,
  'compass': Compass,

  // Detalhes do Filme & Tempo
  'clock': Clock,
  'time-outline': Clock,
  'calendar': Calendar,

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
  'pie-chart': PieChart,
  'award': Award,
  'trophy': Trophy,
  'activity': Activity,
  'zap': Zap,
};

export const Icon = ({ name, size = 20, color = '#FFFFFF', style = {} }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent size={size} color={color} style={style} />;
};

export default Icon;
