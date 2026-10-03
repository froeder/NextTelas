import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const ICON_MAP = {
  // Cinema & Mídia
  'film': 'film',
  'film-outline': 'film-outline',
  'flame': 'flame',
  'flame-outline': 'flame-outline',
  'sparkles': 'sparkles',
  'sparkles-outline': 'sparkles-outline',
  'play': 'play',
  'play-circle': 'play-circle',
  'tv': 'tv-outline',
  'arrow-back': 'arrow-back',
  'arrow-back-outline': 'arrow-back-outline',
  'arrow-left': 'arrow-back',

  // Navegação, Watchlist e Ações
  'search': 'search',
  'search-outline': 'search-outline',
  'star': 'star',
  'trash-outline': 'trash-outline',
  'trash': 'trash',
  'checkmark': 'checkmark',
  'checkmark-circle': 'checkmark-circle',
  'add': 'add',
  'add-circle-outline': 'add-circle-outline',
  'close-circle': 'close-circle',
  'close-outline': 'close-outline',
  'close': 'close',
  'external-link': 'open-outline',
  'compass': 'compass-outline',
  'bookmark': 'bookmark',
  'bookmark-outline': 'bookmark-outline',
  'bookmark-check': 'bookmark',
  'heart': 'heart',
  'heart-outline': 'heart-outline',

  // Detalhes do Filme & Tempo
  'clock': 'time-outline',
  'time': 'time',
  'time-outline': 'time-outline',
  'calendar': 'calendar',
  'calendar-outline': 'calendar-outline',

  // Autenticação & Usuário
  'mail': 'mail',
  'mail-outline': 'mail-outline',
  'lock-closed-outline': 'lock-closed-outline',
  'lock': 'lock-closed',
  'eye': 'eye-outline',
  'eye-outline': 'eye-outline',
  'eye-off': 'eye-off-outline',
  'eye-off-outline': 'eye-off-outline',
  'user': 'person',
  'person-circle-outline': 'person-circle-outline',
  'log-out': 'log-out-outline',
  'log-out-outline': 'log-out-outline',

  // Informações & Gráficos
  'analytics': 'stats-chart',
  'stats-chart': 'stats-chart',
  'trending-up': 'trending-up',
  'alert-circle': 'alert-circle',
  'information-circle': 'information-circle',
  'info': 'information-circle',
  'pie-chart': 'pie-chart',
  'award': 'trophy-outline',
  'trophy': 'trophy',
  'activity': 'pulse',
  'zap': 'flash',
};

export const Icon = ({ name, size = 20, color = '#FFFFFF', style = {} }) => {
  const mappedName = ICON_MAP[name];
  const iconName = mappedName || (Ionicons.glyphMap && Ionicons.glyphMap[name] ? name : 'help-circle-outline');
  return <Ionicons name={iconName} size={size} color={color} style={style} />;
};

export default Icon;
