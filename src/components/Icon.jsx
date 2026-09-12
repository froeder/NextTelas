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
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Heart,
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
  'arrow-back': ArrowLeft,
  'arrow-left': ArrowLeft,

  // Navegação, Watchlist e Ações
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
  'close-outline': XCircle,
  'close': X,
  'external-link': ExternalLink,
  'compass': Compass,
  'bookmark': BookmarkCheck,
  'bookmark-outline': Bookmark,
  'bookmark-check': BookmarkCheck,
  'heart': Heart,
  'heart-outline': Heart,

  // Detalhes do Filme & Tempo
  'clock': Clock,
  'time': Clock,
  'time-outline': Clock,
  'calendar': Calendar,
  'calendar-outline': Calendar,

  // Autenticação & Usuário
  'mail': Mail,
  'mail-outline': Mail,
  'lock-closed-outline': Lock,
  'eye': Eye,
  'eye-outline': Eye,
  'eye-off': EyeOff,
  'eye-off-outline': EyeOff,
  'user': User,
  'person-circle-outline': User,
  'log-out': LogOut,
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
