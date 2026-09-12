import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';

export const CustomTabBar = ({ activeTab, onSelectTab, watchedCount = 0 }) => {
  const tabs = [
    {
      key: 'recommendations',
      label: 'Descobrir',
      icon: 'sparkles',
      activeIcon: 'sparkles',
    },
    {
      key: 'search',
      label: 'Buscar',
      icon: 'search-outline',
      activeIcon: 'search',
    },
    {
      key: 'watched',
      label: 'Já Assisti',
      icon: 'film-outline',
      activeIcon: 'film',
      badge: watchedCount > 0 ? watchedCount : null,
    },
    {
      key: 'stats',
      label: 'Estatísticas',
      icon: 'analytics',
      activeIcon: 'analytics',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Icon
                name={isActive ? tab.activeIcon : tab.icon}
                size={20}
                color={isActive ? theme.colors.primary : theme.colors.textMuted}
              />
              {tab.badge !== null && tab.badge !== undefined ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
              ]}
            >
              {tab.label}
            </Text>

            {isActive ? <View style={styles.activeIndicator} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    paddingVertical: 8,
    paddingBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: 2,
  },
  iconWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: theme.colors.primary,
  },
  inactiveTabLabel: {
    color: theme.colors.textMuted,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
});
