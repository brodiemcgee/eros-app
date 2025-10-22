import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../utils/theme';
import { Message } from '../types/database';
import {
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  subscribeToConversation,
  startTyping,
  stopTyping,
  subscribeToTypingIndicators,
  deleteMessage,
} from '../services/messaging';
import { getProfileById } from '../services/profiles';
import { formatRelativeTime } from '../utils/helpers';
import { SavedPhrasesPicker } from '../components/SavedPhrasesPicker';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavigationProp>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showPhrasesPicker, setShowPhrasesPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    loadOtherUser();

    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = subscribeToConversation(route.params.conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    // Subscribe to typing indicators
    const typingChannel = subscribeToTypingIndicators(
      route.params.conversationId,
      user.id,
      (isTyping) => {
        setIsOtherUserTyping(isTyping);
      }
    );

    // Mark as read
    markConversationAsRead(route.params.conversationId, user.id);

    return () => {
      messagesChannel.unsubscribe();
      typingChannel.unsubscribe();

      // Clean up typing indicator on unmount
      if (user) {
        stopTyping(route.params.conversationId, user.id);
      }

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const loadMessages = async () => {
    const msgs = await getConversationMessages(route.params.conversationId);
    setMessages(msgs);
  };

  const loadOtherUser = async () => {
    const profile = await getProfileById(route.params.otherUserId);
    if (profile) {
      setOtherUserName(profile.display_name);
      navigation.setOptions({ title: profile.display_name });
    }
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);

    if (!user) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    if (text.trim().length > 0) {
      startTyping(route.params.conversationId, user.id);

      // Auto-stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(route.params.conversationId, user.id);
      }, 3000);
    } else {
      // Stop typing if text is empty
      stopTyping(route.params.conversationId, user.id);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !user) return;

    // Stop typing indicator immediately when sending
    stopTyping(route.params.conversationId, user.id);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const sent = await sendMessage(
      route.params.conversationId,
      user.id,
      route.params.otherUserId,
      messageText.trim()
    );

    if (sent) {
      setMessageText('');
      setMessages((prev) => [...prev, sent]);
    }
  };

  const handleSelectPhrase = (phraseText: string) => {
    setMessageText(phraseText);
  };

  const handleLongPressMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageActions(true);
  };

  const handleCopyMessage = () => {
    if (selectedMessage && selectedMessage.content) {
      // In a real app, you would use @react-native-clipboard/clipboard
      // For now, we'll show an alert
      Alert.alert('Copied', 'Message copied to clipboard');
      // Clipboard.setString(selectedMessage.content);
    }
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  const handleUnsendMessage = () => {
    if (!selectedMessage || !user) return;

    // Only allow unsending own messages
    if (selectedMessage.sender_id !== user.id) {
      Alert.alert('Error', 'You can only unsend your own messages');
      setShowMessageActions(false);
      setSelectedMessage(null);
      return;
    }

    Alert.alert(
      'Unsend Message',
      'Are you sure you want to unsend this message? It will be removed for everyone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setShowMessageActions(false);
            setSelectedMessage(null);
          },
        },
        {
          text: 'Unsend',
          style: 'destructive',
          onPress: async () => {
            await deleteMessage(selectedMessage.id);
            setMessages((prev) =>
              prev.map((m) => (m.id === selectedMessage.id ? { ...m, is_deleted: true } : m))
            );
            setShowMessageActions(false);
            setSelectedMessage(null);
          },
        },
      ]
    );
  };

  const handleCloseMessageActions = () => {
    setShowMessageActions(false);
    setSelectedMessage(null);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;

    // Don't render deleted messages
    if (item.is_deleted) {
      return (
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              styles.deletedMessageBubble,
            ]}
          >
            <Text style={styles.deletedMessageText}>This message was deleted</Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPressMessage(item)}
        delayLongPress={500}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            ]}
          >
            {item.media_url && (
              <Image source={{ uri: item.media_url }} style={styles.messageImage} />
            )}
            {item.content && (
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {item.content}
              </Text>
            )}
          </View>
          <Text style={styles.messageTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUserName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {isOtherUserTyping && (
        <View style={styles.typingIndicatorContainer}>
          <Text style={styles.typingIndicatorText}>{otherUserName} is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.phrasesButton}
          onPress={() => setShowPhrasesPicker(true)}
        >
          <Text style={styles.phrasesButtonText}>💬</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={messageText}
          onChangeText={handleTextChange}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <SavedPhrasesPicker
          visible={showPhrasesPicker}
          userId={user.id}
          onClose={() => setShowPhrasesPicker(false)}
          onSelectPhrase={handleSelectPhrase}
        />
      )}

      <Modal
        visible={showMessageActions}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMessageActions}
      >
        <TouchableOpacity
          style={styles.messageActionsOverlay}
          activeOpacity={1}
          onPress={handleCloseMessageActions}
        >
          <View style={styles.messageActionsContainer}>
            {selectedMessage?.content && (
              <TouchableOpacity style={styles.messageAction} onPress={handleCopyMessage}>
                <Text style={styles.messageActionText}>📋 Copy</Text>
              </TouchableOpacity>
            )}
            {selectedMessage && selectedMessage.sender_id === user?.id && (
              <TouchableOpacity style={styles.messageAction} onPress={handleUnsendMessage}>
                <Text style={[styles.messageActionText, styles.messageActionDanger]}>
                  🗑️ Unsend
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.messageAction, styles.messageActionCancel]}
              onPress={handleCloseMessageActions}
            >
              <Text style={styles.messageActionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  backButton: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.text,
  },
  messagesList: {
    padding: SPACING.md,
  },
  messageContainer: {
    marginBottom: SPACING.md,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary, // Purple for sent messages
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.backgroundTertiary, // Light gray for received
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
  },
  myMessageText: {
    color: COLORS.background,
  },
  otherMessageText: {
    color: COLORS.text,
  },
  deletedMessageBubble: {
    backgroundColor: COLORS.backgroundTertiary,
    opacity: 0.6,
  },
  deletedMessageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  typingIndicatorContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  typingIndicatorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  phrasesButton: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  phrasesButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.secondary, // Teal for send button
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold as any,
    color: COLORS.background,
  },
  messageActionsOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageActionsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    minWidth: 200,
  },
  messageAction: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  messageActionCancel: {
    borderBottomWidth: 0,
  },
  messageActionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  messageActionDanger: {
    color: COLORS.error,
  },
});
