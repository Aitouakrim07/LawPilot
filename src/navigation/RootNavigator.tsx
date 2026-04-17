import { Ionicons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from '../theme';
import { ClientsScreen } from '../screens/ClientsScreen';
import { MattersScreen } from '../screens/MattersScreen';
import { RemindersScreen } from '../screens/RemindersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { VoiceAssistantScreen } from '../screens/VoiceAssistantScreen';
import type { HomeTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    border: theme.colors.border,
    text: theme.colors.text,
    primary: theme.colors.primary,
  },
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.bodySemiBold,
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            color={color}
            size={size}
            name={getTabIconName(route.name)}
          />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Voice" component={VoiceAssistantScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Matters" component={MattersScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={HomeTabs} />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function getTabIconName(routeName: keyof HomeTabParamList): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'Today':
      return 'calendar-outline';
    case 'Voice':
      return 'mic-outline';
    case 'Clients':
      return 'people-outline';
    case 'Matters':
      return 'briefcase-outline';
    case 'Tasks':
      return 'checkmark-done-outline';
    default:
      return 'ellipse-outline';
  }
}
