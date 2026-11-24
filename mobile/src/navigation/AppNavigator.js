import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LoadingView from '../components/LoadingView';
import colors from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import CatalogScreen from '../screens/CatalogScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const FavoritesStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Fondo del header como .navbar-unab de la web: blanco con línea roja de 2 px abajo.
function HeaderBackground() {
  return <View style={styles.headerBackground} />;
}

// Header común de todos los stacks: título oscuro en negrita y botón atrás en rojo.
const stackScreenOptions = {
  headerBackground: HeaderBackground,
  headerTintColor: colors.primary, // botón atrás
  headerTitleStyle: { color: colors.text, fontWeight: '700' },
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: colors.background },
};

// Ícono de cada pestaña: [activo, inactivo].
const TAB_ICONS = {
  ExploreTab: ['search', 'search-outline'],
  FavoritesTab: ['heart', 'heart-outline'],
  OrdersTab: ['receipt', 'receipt-outline'],
  ProfileTab: ['person', 'person-outline'],
};

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={stackScreenOptions}>
      <ExploreStack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Catálogo' }} />
      <ExploreStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Detalle' }}
      />
    </ExploreStack.Navigator>
  );
}

function FavoritesStackNavigator() {
  return (
    <FavoritesStack.Navigator screenOptions={stackScreenOptions}>
      <FavoritesStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favoritos' }}
      />
      <FavoritesStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Detalle' }}
      />
    </FavoritesStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={stackScreenOptions}>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Mis pedidos' }} />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Detalle del pedido' }}
      />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // cada pestaña usa el header de su stack
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const [activeIcon, inactiveIcon] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? activeIcon : inactiveIcon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ExploreTab" component={ExploreStackNavigator} options={{ title: 'Explorar' }} />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStackNavigator}
        options={{ title: 'Favoritos' }}
      />
      <Tab.Screen name="OrdersTab" component={OrdersStackNavigator} options={{ title: 'Mis pedidos' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingView message="Cargando sesión..." />;
  }

  // Sin sesión solo existe Login; con sesión, las pestañas. Al cambiar el token,
  // React Navigation cambia de pantalla solo (no hace falta navegar a mano).
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <RootStack.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Login" component={LoginScreen} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    flex: 1,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabBarLabel: {
    fontWeight: '600',
  },
});
