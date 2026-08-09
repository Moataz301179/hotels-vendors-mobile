import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Keyboard,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { aiAPI, type AiMessage } from "@/api";
import { useAuthStore } from "@/store/auth";
import * as SecureStore from "expo-secure-store";
import { Send, Bot, User, Trash2 } from "lucide-react-native";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  isStreaming?: boolean;
}

export default function AiAssistantScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    SecureStore.getItemAsync("ai_conversation_id").then((id) => {
      if (id) setConversationId(id);
    });
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    Keyboard.dismiss();

    const role = user?.platformRole?.toLowerCase() || "hotel";
    const fullPayload: AiMessage[] = [...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })), { role: "user", content: input.trim() }];

    let assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const response = await aiAPI.ask({
        messages: fullPayload,
        question: input.trim(),
        role,
        hotelId: user?.hotelId ?? undefined,
        conversationId: conversationId ?? undefined,
      });

      // Extract conversation ID from response headers
      const convId = response.headers?.["x-conversation-id"];
      if (convId && convId !== conversationId) {
        setConversationId(convId);
        await SecureStore.setItemAsync("ai_conversation_id", convId);
      }

      // Handle streaming response
      const data = response.data;
      if (typeof data === "string") {
        assistantMsg.content = data;
      } else if (data?.text) {
        assistantMsg.content = data.text;
      } else if (data?.content) {
        assistantMsg.content = data.content;
      } else {
        assistantMsg.content = JSON.stringify(data);
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: assistantMsg.content } : m
        )
      );
    } catch (e: any) {
      const errorMessage = e?.response?.data?.error || e?.message || "Connection failed";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `Error: ${errorMessage}`, isStreaming: false }
            : m
        )
      );
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, isStreaming: false } : m))
      );
    }
  }, [input, isStreaming, messages, user, conversationId]);

  const clearChat = useCallback(() => {
    Alert.alert("Clear Chat", "Remove all messages?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setMessages([]) },
    ]);
  }, []);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.avatar, isUser ? styles.userAvatar : styles.assistantAvatar]}>
          {isUser ? (
            <User size={16} color={colors.bg} />
          ) : (
            <Bot size={16} color={colors.bg} />
          )}
        </View>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          {item.isStreaming ? <ActivityIndicator size="small" color={colors.textMuted} style={styles.streaming} /> : null}
        </View>
      </View>
    );
  };

  const welcomeMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: `Hello${user?.name ? `, ${user.name.split(" ")[0]}` : ""}! I'm your HOVIN AI assistant. I can help with procurement insights, order optimization, and spend analysis. What would you like to discuss?`,
  };

  const showWelcome = messages.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        {messages.length > 0 ? (
          <TouchableOpacity onPress={clearChat} activeOpacity={0.7}>
            <Trash2 size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showWelcome ? (
        <View style={styles.welcomeContainer}>
          {renderMessage({ item: welcomeMessage })}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about orders, suppliers, spend…"
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() || isStreaming ? styles.sendBtnDisabled : null]}
          onPress={sendMessage}
          disabled={!input.trim() || isStreaming}
          activeOpacity={0.7}
        >
          <Send size={18} color={colors.bg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...typography.h2, color: colors.text },
  welcomeContainer: { flex: 1, justifyContent: "center", padding: spacing.md },
  messageList: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  messageRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  avatar: {
    width: 32, height: 32, borderRadius: radii.full,
    alignItems: "center", justifyContent: "center",
  },
  userAvatar: { backgroundColor: colors.primary },
  assistantAvatar: { backgroundColor: colors.textMuted },
  messageBubble: { maxWidth: "82%", borderRadius: radii.lg, padding: spacing.md },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  messageText: { ...typography.body, lineHeight: 22 },
  userText: { color: colors.bg },
  assistantText: { color: colors.textSecondary },
  streaming: { marginTop: spacing.xs, alignSelf: "flex-start" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: spacing.sm,
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.text, borderWidth: 1, borderColor: colors.border,
    ...typography.body, maxHeight: 100, minHeight: 40,
  },
  sendBtn: {
    backgroundColor: colors.primary, width: 40, height: 40,
    borderRadius: radii.full, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
