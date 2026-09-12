export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  ExtraInfo: { token: string };
  Main: undefined;
};

export type TabParamList = {
  Home: undefined;
  Input: undefined;
  Report: { tab?: 'checkup' | 'vitals' | 'pharmacy' | 'hospital' };
  Health: undefined;
  Records: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Mypage: undefined;
  NotificationList: undefined;
  Premium: { returnTo?: string };
  ProfileEdit: undefined;
  HealthGoal: undefined;
  NotificationSettings: undefined;
  ConsentManagement: undefined;
};
