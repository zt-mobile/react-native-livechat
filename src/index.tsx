import {
  NativeModules,
  BackHandler,
  NativeEventEmitter,
  EventSubscription,
  StatusBar,
  Platform
} from 'react-native';
import { useState, useEffect } from 'react';
const { RNLiveChat } = NativeModules;

const emitter = new NativeEventEmitter(RNLiveChat);

type RNLiveChatEvent = 'onChatWindowVisibilityChanged';

type RNLiveChatType = {
  initialize(license: string): void;
  setGroup(groupId: string): void;
  presentChat(): void;
  setCustomer(name: string, email: string): void;
  setVariable(key: string, value: string): void;
  // Only available on Android
  hideChat(): void;

  addEventListener(
    eventType: RNLiveChatEvent,
    listener: (...args: []) => any
  ): EventSubscription;
  removeAllListeners(eventType: RNLiveChatEvent): void;
};

export const useLiveChat = (): RNLiveChatType => {
  const [liveChatShowed, setLiveChatShowed] = useState<boolean>(false);

  const presentChat = () => {
    StatusBar.setHidden(true, 'none');
    RNLiveChat.presentChat();
  };

  useEffect(() => {
    const onHardwareBackButtonPress = () => {
      if (liveChatShowed) {
        RNLiveChat.hideChat();
        return true;
      } else {
        return null;
      }
    };

    var backHandlerListener = Platform.OS === "android" ? BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBackButtonPress
    ) : null;

    var handleLiveChatVisibilityChanged = Platform.OS === "android"? emitter.addListener(
      'onChatWindowVisibilityChanged',
      ({ visible }) => {
        if (!visible) {
          StatusBar.setHidden(false, 'none');
        }
        setLiveChatShowed(visible);
      }
    ) : null;

    return () => {
      if (Platform.OS === "android"){
        if (backHandlerListener != null) {
          backHandlerListener.remove();
        }
        if (handleLiveChatVisibilityChanged != null) {
          handleLiveChatVisibilityChanged.remove();
        }
      }
    };
  }, [liveChatShowed]);

  return {
    ...RNLiveChat,
    presentChat,
  } as RNLiveChatType;
};

export default {
  ...RNLiveChat,
  addEventListener: (
    eventType: RNLiveChatEvent,
    listener: (...args: []) => any
  ) => emitter.addListener(eventType, listener),
  removeAllListeners: (eventType: RNLiveChatEvent) =>
    emitter.removeAllListeners(eventType),
} as RNLiveChatType;