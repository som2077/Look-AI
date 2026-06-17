import { MaterialTopTabs } from "../../../components/navigation/MaterialTopTabs";
import { CustomTabBar } from "../../../components/navigation/CustomTabBar";

const renderTabBar = (props: any) => <CustomTabBar {...props} />;

export default function TabLayout() {
  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      tabBar={renderTabBar}
      screenOptions={{
        lazy: true,
        swipeEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen name="index" options={{ title: "Home" }} />
      <MaterialTopTabs.Screen name="wardrobe" options={{ title: "Wardrobe" }} />
      <MaterialTopTabs.Screen name="explore" options={{ title: "Explore" }} />
      <MaterialTopTabs.Screen name="profile" options={{ title: "Profile" }} />
    </MaterialTopTabs>
  );
}
