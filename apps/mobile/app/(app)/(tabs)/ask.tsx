import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import {
  useGenericKeyboardHandler,
  useKeyboardState,
} from 'react-native-keyboard-controller';

import { ThemedText } from '../../../components/ThemedText';
import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import { LoadingSkeleton } from '../../../components/ui/EmptyState';
import { GlassPanel, ScreenGradient } from '../../../components/ui/Glass';
import {
  KairosBottomSheet,
  KairosMemoryRow,
  KairosText,
} from '../../../components/ui/Kairos';
import { AskBubble, EvidenceCard } from '../../../components/ui/MemoryCards';
import { useAppTheme } from '../../../providers/ThemeProvider';
import {
  ApiError,
  askKairos,
  fetchConversation,
  fetchProjects,
  fetchTopics,
  listConversations,
  type ApiConversationSummary,
} from '../../../lib/api';
import { askPrompts } from '../../../lib/discovery';
import type { AskMessage } from '../../../types';

const INPUT_MIN = 22;
const INPUT_MAX = 120;

function useGradualKeyboardHeight() {
  const height = useSharedValue(0);
  useGenericKeyboardHandler(
    {
      onMove: (event) => {
        'worklet';
        height.value = Math.max(event.height, 0);
      },
      onEnd: (event) => {
        'worklet';
        height.value = Math.max(event.height, 0);
      },
    },
    [],
  );
  return height;
}

function toUiMessages(
  rows: Array<{
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: string;
    citations?: AskMessage['sources'];
    insufficientEvidence?: boolean | null;
  }>,
): AskMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role === 'USER' ? 'user' : 'kairos',
    content: row.content,
    createdAt: row.createdAt,
    sources: row.citations?.map((c) => ({
      observationId: c.observationId,
      chunkId: c.chunkId,
      title: c.title,
      snippet: c.snippet,
      createdAt: c.createdAt,
    })),
    insufficientEvidence: row.insufficientEvidence ?? undefined,
  }));
}

export default function AskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius, isLight } = useAppTheme();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    q?: string;
    scopeType?: string;
    scopeId?: string;
    scopeName?: string;
  }>();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const hasListRef = useRef(false);
  const keyboardHeight = useGradualKeyboardHeight();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [conversations, setConversations] = useState<ApiConversationSummary[]>(
    [],
  );
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState('Ask Kairos');
  const [scopeType, setScopeType] = useState<
    'topic' | 'entity' | 'project' | 'observation' | null
  >(
    params.scopeType === 'topic' ||
      params.scopeType === 'entity' ||
      params.scopeType === 'project' ||
      params.scopeType === 'observation'
      ? params.scopeType
      : null,
  );
  const [scopeId, setScopeId] = useState<string | null>(
    typeof params.scopeId === 'string' ? params.scopeId : null,
  );
  const [scopeName, setScopeName] = useState<string | null>(
    typeof params.scopeName === 'string' ? params.scopeName : null,
  );
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(INPUT_MIN);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState('Looking through your memories…');

  const canSend = input.trim().length > 0 && !typing;
  const emptyThread = messages.length === 0 && !typing;

  const keyboardSpacerStyle = useAnimatedStyle(() => ({
    height: Math.abs(keyboardHeight.value),
  }));

  const scrollToEnd = (animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  };

  useEffect(() => {
    if (keyboardVisible) scrollToEnd();
  }, [keyboardVisible]);

  const refreshList = useCallback(async () => {
    if (!hasListRef.current) setLoadingList(true);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('You must be signed in.', 401);
      const data = await listConversations({ token, limit: 30 });
      setConversations(data.items);
      hasListRef.current = true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not load conversations.',
      );
    } finally {
      setLoadingList(false);
    }
  }, [getToken]);

  useEffect(() => {
    void refreshList();
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [topicData, projectData] = await Promise.all([
          fetchTopics({ token, limit: 8 }),
          fetchProjects({ token, limit: 6 }),
        ]);
        setPrompts(
          askPrompts({
            topics: topicData.items,
            projects: projectData.items,
            weekCount: 1,
          }),
        );
      } catch {
        setPrompts(askPrompts({ topics: [], projects: [], weekCount: 1 }));
      }
    })();
  }, [getToken, refreshList]);

  const openConversation = async (id: string) => {
    setError(null);
    setLoadingThread(true);
    setMessages([]);
    setConversationId(id);
    setConversationTitle('…');
    setHistoryOpen(false);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('You must be signed in.', 401);
      const detail = await fetchConversation({ token, id, limit: 50 });
      setConversationId(detail.id);
      setConversationTitle(detail.title);
      setMessages(
        toUiMessages(
          detail.messages.map((m) => ({
            ...m,
            citations: m.citations,
          })),
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not open conversation.',
      );
    } finally {
      setLoadingThread(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setConversationTitle('New conversation');
    setMessages([]);
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  useEffect(() => {
    if (scopeId && scopeName) {
      setConversationTitle(`Ask · ${scopeName}`);
    }
  }, [scopeId, scopeName]);

  const send = async (text: string) => {
    const query = text.trim();
    if (!query || typing) return;

    const clientRequestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const optimisticUser: AskMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput('');
    setInputHeight(INPUT_MIN);
    setTyping(true);
    setError(null);
    setStatusLabel('Searching memories…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollToEnd();

    try {
      const token = await getToken();
      if (!token) throw new ApiError('You must be signed in to ask Kairos.', 401);

      setStatusLabel('Thinking…');
      const result = await askKairos({
        token,
        question: query,
        limit: 6,
        conversationId: conversationId ?? undefined,
        clientRequestId,
        filters: {
          topicId: scopeType === 'topic' ? scopeId ?? undefined : undefined,
          entityId: scopeType === 'entity' ? scopeId ?? undefined : undefined,
          projectId: scopeType === 'project' ? scopeId ?? undefined : undefined,
          observationId:
            scopeType === 'observation' ? scopeId ?? undefined : undefined,
        },
      });

      setConversationId(result.conversationId);
      if (!conversationId) {
        setConversationTitle(query.slice(0, 80));
      }

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticUser.id);
        return [
          ...withoutOptimistic,
          {
            id: result.userMessageId,
            role: 'user',
            content: query,
            createdAt: new Date().toISOString(),
          },
          {
            id: result.assistantMessageId,
            role: 'kairos',
            content: result.answer,
            createdAt: new Date().toISOString(),
            sources: result.citations.map((citation) => ({
              observationId: citation.observationId,
              chunkId: citation.chunkId,
              title: citation.title,
              snippet: citation.snippet,
              createdAt: citation.createdAt,
            })),
            insufficientEvidence: result.insufficientEvidence,
          },
        ];
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Kairos could not answer right now. Try again.';
      setError(message);
    } finally {
      setTyping(false);
      scrollToEnd();
    }
  };

  useEffect(() => {
    if (typeof params.q === 'string' && params.q.length > 0 && messages.length === 0) {
      startNewConversation();
      void send(params.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  return (
    <ScreenGradient>
      <View style={styles.flex}>
          <View style={[styles.threadHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => {
              void refreshList();
              setHistoryOpen(true);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Conversation history"
          >
            <Feather name="clock" size={20} color={colors.text} />
          </Pressable>
          <ThemedText colorKey="text" style={styles.threadTitle} numberOfLines={1}>
            {emptyThread ? 'Ask Kairos' : conversationTitle}
          </ThemedText>
          <Pressable onPress={startNewConversation} hitSlop={8} accessibilityRole="button" accessibilityLabel="New conversation">
            <Feather name="edit" size={18} color={colors.accent} />
          </Pressable>
        </View>

        {scopeName ? (
          <View style={styles.scopeRow}>
            <GlassPanel contentStyle={styles.scopeChip} padded={false}>
              <ThemedText colorKey="text" style={styles.scopeLabel}>
                {scopeName}
              </ThemedText>
              <Pressable
                onPress={() => {
                  setScopeType(null);
                  setScopeId(null);
                  setScopeName(null);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear scope"
              >
                <Feather name="x" size={14} color={colors.textMuted} />
              </Pressable>
            </GlassPanel>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            emptyThread && styles.contentEmpty,
            { paddingBottom: 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (!emptyThread) scrollToEnd(false);
          }}
        >
          {loadingThread ? (
            <LoadingSkeleton rows={5} />
          ) : null}

          {emptyThread && !loadingThread ? (
            <Pressable style={styles.empty} onPress={() => inputRef.current?.focus()}>
              <KairosText variant="heading">What do you want to know?</KairosText>
              <View style={styles.starters}>
                {(prompts.length > 0 ? prompts : ['What have I been working on recently?']).map((q) => (
                  <Pressable key={q} onPress={() => void send(q)} accessibilityRole="button" accessibilityLabel={q}>
                    <GlassPanel contentStyle={styles.starterInner} padded={false}>
                      <Feather name="arrow-up-right" size={14} color={colors.accent} />
                      <ThemedText colorKey="text" style={styles.starter} numberOfLines={2}>
                        {q}
                      </ThemedText>
                    </GlassPanel>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          ) : null}

          <View style={styles.thread}>
            {messages.map((message) => (
              <View key={message.id} style={styles.messageBlock}>
                <AskBubble message={message} />
                {message.role === 'kairos' && message.sources && message.sources.length > 0 ? (
                  <View style={styles.sources}>
                    <ThemedText colorKey="textMuted" style={styles.kicker}>
                      {message.insufficientEvidence
                        ? 'I do not have enough evidence yet'
                        : `Based on ${message.sources.length} ${message.sources.length === 1 ? 'memory' : 'memories'}`}
                    </ThemedText>
                    {message.sources.map((source) => (
                      <EvidenceCard
                        key={`${source.observationId}:${source.chunkId}`}
                        source={source}
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/observation/[id]',
                            params: {
                              id: source.observationId,
                              highlight: source.snippet.slice(0, 240),
                            },
                          })
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ))}

            {typing ? (
              <View style={styles.typingBlock}>
                <ActivityIndicator color={colors.accent} size="small" />
                <ThemedText colorKey="textMuted" style={styles.typingLabel}>
                  {statusLabel}
                </ThemedText>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBlock}>
                <ThemedText colorKey="error" style={styles.body}>
                  {error}
                </ThemedText>
                <Pressable
                  onPress={() => {
                    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUser) void send(lastUser.content);
                  }}
                  hitSlop={8}
                >
                  <ThemedText colorKey="accent" style={styles.retry}>
                    Retry
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.composerDock,
            {
              borderTopColor: colors.glassBorder,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.composer,
              {
                borderRadius: radius['2xl'],
                borderColor: colors.glassBorder,
                backgroundColor: colors.surfaceGlass,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Ask…"
              placeholderTextColor={colors.inputPlaceholder}
              accessibilityLabel="Ask Kairos"
              multiline
              blurOnSubmit={false}
              returnKeyType="default"
              keyboardAppearance={isLight ? 'light' : 'dark'}
              onContentSizeChange={(e) => {
                const next = Math.min(
                  INPUT_MAX,
                  Math.max(INPUT_MIN, e.nativeEvent.contentSize.height),
                );
                setInputHeight(next);
              }}
              onFocus={() => scrollToEnd()}
              style={[
                styles.input,
                {
                  color: colors.text,
                  height: Math.max(inputHeight, INPUT_MIN),
                },
              ]}
            />
            <Pressable
              disabled={!canSend}
              onPress={() => void send(input)}
              accessibilityRole="button"
              accessibilityLabel="Send"
              style={({ pressed }) => [
                styles.sendWrap,
                { opacity: !canSend ? 0.35 : pressed ? 0.75 : 1 },
              ]}
            >
              <View style={[styles.send, { backgroundColor: colors.buttonFill }]}>
                <Feather name="arrow-up" size={18} color={colors.buttonText} />
              </View>
            </Pressable>
          </View>
        </View>

        {keyboardVisible ? (
          <Animated.View style={keyboardSpacerStyle} />
        ) : (
          <View style={{ height: FLOATING_TAB_BAR_CONTENT + Math.max(insets.bottom, 10) }} />
        )}

        <KairosBottomSheet visible={historyOpen} title="History" onClose={() => setHistoryOpen(false)}>
          {loadingList && conversations.length === 0 ? (
            <LoadingSkeleton rows={4} />
          ) : conversations.length === 0 ? (
            <KairosText variant="caption" color="textSecondary">
              No conversations yet.
            </KairosText>
          ) : (
            conversations.map((item) => (
              <KairosMemoryRow
                key={item.id}
                filename={item.title}
                summary={null}
                capturedAt={item.updatedAt}
                onPress={() => void openConversation(item.id)}
              />
            ))
          )}
        </KairosBottomSheet>
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
    flexGrow: 1,
  },
  contentEmpty: { justifyContent: 'center' },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  listTitleBlock: { flex: 1, gap: 4 },
  newChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newLabel: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 14,
  },
  listContent: { padding: 16, gap: 10 },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  conversationTitle: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 15,
  },
  meta: { fontFamily: 'Roboto_400Regular', fontSize: 12, marginTop: 2 },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  threadTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  scopeRow: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  scopeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scopeLabel: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 13,
  },
  empty: { gap: 10, paddingBottom: 24 },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 36,
    letterSpacing: -0.7,
    lineHeight: 40,
  },
  emptyHint: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  starters: { gap: 10 },
  starterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  starter: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    fontSize: 15,
    lineHeight: 21,
  },
  kicker: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  body: { fontFamily: 'Roboto_400Regular', fontSize: 15, lineHeight: 22 },
  thread: { gap: 20 },
  messageBlock: { gap: 10 },
  sources: { gap: 8 },
  typingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  typingLabel: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
  },
  errorBlock: { gap: 6, paddingVertical: 4 },
  retry: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 14,
  },
  composerDock: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  input: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    lineHeight: 22,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: INPUT_MAX,
    textAlignVertical: 'center',
  },
  sendWrap: {
    marginBottom: 1,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
