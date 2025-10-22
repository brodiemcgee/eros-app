import { supabase } from './supabase';
import { Conversation, Message, ConversationWithProfile, ProfileWithPhotos } from '../types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

// Get or create a conversation between two users
export const getOrCreateConversation = async (
  userId: string,
  otherUserId: string
): Promise<Conversation | null> => {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(participant1_id.eq.${userId},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${userId})`)
    .single();

  if (existing) {
    return existing;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participant1_id: userId,
      participant2_id: otherUserId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
};

// Get all conversations for a user
export const getUserConversations = async (
  userId: string
): Promise<ConversationWithProfile[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant1:profiles!conversations_participant1_id_fkey(*, photos:profile_photos(*)),
      participant2:profiles!conversations_participant2_id_fkey(*, photos:profile_photos(*))
    `)
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // Transform data to include the other user's profile
  return data.map((conv: any) => {
    const otherProfile = conv.participant1_id === userId ? conv.participant2 : conv.participant1;

    // Get unread count
    return {
      ...conv,
      other_profile: otherProfile as ProfileWithPhotos,
      unread_count: 0, // Will be fetched separately if needed
    };
  });
};

// Get messages for a conversation
export const getConversationMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data.reverse(); // Reverse to show oldest first
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video'
): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content || null,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return data;
};

// Mark message as read
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (error) {
    console.error('Error marking message as read:', error);
  }
};

// Mark all messages in conversation as read
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking conversation as read:', error);
  }
};

// Get unread message count
export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
};

// Subscribe to new messages in a conversation
export const subscribeToConversation = (
  conversationId: string,
  onNewMessage: (message: Message) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  return channel;
};

// Subscribe to all conversations for a user
export const subscribeToUserConversations = (
  userId: string,
  onUpdate: () => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`user:${userId}:conversations`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `or(participant1_id.eq.${userId},participant2_id.eq.${userId})`,
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return channel;
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
  }
};

// Start typing indicator
export const startTyping = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('typing_indicators')
    .upsert({
      conversation_id: conversationId,
      user_id: userId,
      is_typing: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'conversation_id,user_id'
    });

  if (error) {
    console.error('Error starting typing indicator:', error);
  }
};

// Stop typing indicator
export const stopTyping = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('typing_indicators')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error stopping typing indicator:', error);
  }
};

// Subscribe to typing indicators for a conversation
export const subscribeToTypingIndicators = (
  conversationId: string,
  currentUserId: string,
  onTypingChange: (isTyping: boolean) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Only care about other user's typing status
        if (payload.new && (payload.new as any).user_id !== currentUserId) {
          onTypingChange((payload.new as any).is_typing);
        } else if (payload.eventType === 'DELETE' && (payload.old as any).user_id !== currentUserId) {
          onTypingChange(false);
        }
      }
    )
    .subscribe();

  return channel;
};
