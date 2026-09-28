import { useAuth, useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  useGenericKeyboardHandler,
  useKeyboardState,
} from 'react-native-keyboard-controller';

import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import { TabScreenSwipe } from '../../../components/TabScreenSwipe';
import { FadeInContent, LoadingSkeleton, SoftRefreshBar } from '../../../components/ui/EmptyState';
import { ScreenGradient } from '../../../components/ui/Glass';
import { AskBubble } from '../../../components/ui/MemoryCards';
import { itemEntering, PressScale } from '../../../components/ui/Motion';
import { Mascot } from '../../../components/ui/system/Mascot';
import { TopBar } from '../../../components/ui/system/TopBar';
import { mascotSize } from '../../../theme';
import { useAppTheme } from '../../../providers/ThemeProvider';
import {
  ApiError,
  askKairos,
  deleteConversation,
  fetchConversation,
  fetchPredictions,
  fetchTopics,
  fetchEntities,
  fetchProjects,
  fetchObservationsPage,
  listConversations,
  type ApiSemanticSearchFilters,
  type ApiConversationDetail,
  type ApiConversationSummary,
  type PredictionsSummary,
} from '../../../lib/api';
import type { AskMessage } from '../../../types';
import { useProgression } from '../../../providers/ProgressionProvider';
import { dedupeRequest, readQueryCache, writeQueryCache } from '../../../hooks/useAsync';
import { removeCache } from '../../../lib/persistentCache';

const CONVERSATIONS_KEY = 'ask:conversations';
/** Same key as Today / Predictions so suggestions show instantly. */
const PREDICTIONS_KEY = 'predictions';

function suggestionsFrom(data: PredictionsSummary | null): string[] {
  return data ? data.items.slice(0, 4).map((item) => item.title) : [];
}

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const STARTERS: { icon: IconName; prompt: string }[] = [
  { icon: 'trending-up', prompt: 'What have I been focused on lately?' },
  { icon: 'bubble-chart', prompt: 'What patterns do you notice?' },
  { icon: 'schedule', prompt: 'When am I most productive?' },
  { icon: 'school', prompt: 'What did I learn last week?' },
];

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

function useDotStyle(pulse: SharedValue<number>, delay: number) {
  return useAnimatedStyle(() => {
    const t = (pulse.value + delay) % 1;
    return {
      opacity: interpolate(t, [0, 0.4, 1], [0.28, 1, 0.28]),
      transform: [{ translateY: interpolate(t, [0, 0.4, 1], [0, -3, 0]) }],
    };
  });
}

function ThinkingDots() {
  const { colors } = useAppTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, false);
  }, [pulse]);

  const a = useDotStyle(pulse, 0);
  const b = useDotStyle(pulse, 0.22);
  const c = useDotStyle(pulse, 0.44);

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, { backgroundColor: colors.text }, a]} />
      <Animated.View style={[styles.dot, { backgroundColor: colors.text }, b]} />
      <Animated.View style={[styles.dot, { backgroundColor: colors.text }, c]} />
    </View>
  );
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
  const { colors, isLight } = useAppTheme();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { refresh: refreshProgression } = useProgression();
  const params = useLocalSearchParams<{
    q?: string;
    scopeType?: string;
    scopeId?: string;
    scopeName?: string;
    filterScope?: string;
  }>();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const hasListRef = useRef(readQueryCache(CONVERSATIONS_KEY) != null);
  const consumedQuery = useRef<string | null>(null);
  const keyboardHeight = useGradualKeyboardHeight();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(() => suggestionsFrom(readQueryCache<PredictionsSummary>(PREDICTIONS_KEY)));
  const [scopePickerOpen, setScopePickerOpen] = useState(false);
  const [scopeChoices, setScopeChoices] = useState<Array<{ id: string; name: string; type: 'topic' | 'entity' | 'project' | 'observation' }>>([]);
  const [conversations, setConversations] = useState<ApiConversationSummary[]>(() => readQueryCache<ApiConversationSummary[]>(CONVERSATIONS_KEY) ?? []);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState('Kairos');
  const [scopeType, setScopeType] = useState<
    'topic' | 'entity' | 'project' | 'observation' | 'filters' | null
  >(
    params.scopeType === 'topic' ||
      params.scopeType === 'entity' ||
      params.scopeType === 'project' ||
      params.scopeType === 'observation' ||
      params.scopeType === 'filters'
      ? params.scopeType
      : null,
  );
  const [scopeId, setScopeId] = useState<string | null>(
    typeof params.scopeId === 'string' ? params.scopeId : null,
  );
  const [scopeName, setScopeName] = useState<string | null>(
    typeof params.scopeName === 'string' ? params.scopeName : null,
  );
  const scopedFilters: ApiSemanticSearchFilters = (() => {
    if (scopeType !== 'filters' || typeof params.filterScope !== 'string') return {};
    try { return JSON.parse(params.filterScope) as ApiSemanticSearchFilters; } catch { return {}; }
  })();
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(INPUT_MIN);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  useEffect(() => {
    void getToken().then(async (token) => {
      if (!token) return;
      try {
        const data = await dedupeRequest(PREDICTIONS_KEY, () => fetchPredictions(token));
        writeQueryCache(PREDICTIONS_KEY, data);
        setSuggestions(suggestionsFrom(data));
      } catch { /* Suggestions are optional. */ }
    });
  }, [getToken]);
  const [error, setError] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState('Looking through your memories…');

  const canSend = input.trim().length > 0 && !typing;
  const emptyThread = messages.length === 0 && !typing && !loadingThread;
  const firstName =
    user?.firstName ||
    user?.fullName?.split(' ')[0] ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    null;

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
      const data = await listConversations({ token, limit: 8 });
      setConversations(data.items);
      writeQueryCache(CONVERSATIONS_KEY, data.items);
      hasListRef.current = true;
    } catch (err) {
      if (!hasListRef.current) {
        setError(
          err instanceof ApiError ? err.message : 'Could not load conversations.',
        );
      }
    } finally {
      setLoadingList(false);
    }
  }, [getToken]);

  const openHistory = () => {
    setHistoryOpen(true);
    void refreshList();
  };

  const openScopePicker = async () => {
    setScopePickerOpen(true);
    try {
      const token = await getToken();
      if (!token) return;
      const [topics, entities, projects, observations] = await Promise.all([
        fetchTopics({ token, limit: 30 }),
        fetchEntities({ token, limit: 30 }),
        fetchProjects({ token, limit: 30 }),
        fetchObservationsPage(token, { limit: 20 }),
      ]);
      setScopeChoices([
        ...topics.items.map((item) => ({ ...item, type: 'topic' as const })),
        ...entities.items.map((item) => ({ ...item, type: 'entity' as const })),
        ...projects.items.map((item) => ({ ...item, type: 'project' as const })),
        ...observations.items.map((item) => ({ id: item.id, name: item.filename, type: 'observation' as const })),
      ]);
    } catch {
      setScopeChoices([]);
    }
  };

  const chooseScope = (type: 'topic' | 'entity' | 'project' | 'observation', id: string, name: string) => {
    setScopeType(type);
    setScopeId(id);
    setScopeName(name);
    setScopePickerOpen(false);
    setConversationId(null);
    setMessages([]);
    setConversationTitle(name);
  };

  const openConversation = async (id: string) => {
    const threadKey = `ask:conversation:${id}`;
    const saved = readQueryCache<ApiConversationDetail>(threadKey);
    setError(null);
    setLoadingThread(!saved);
    setMessages(saved ? toUiMessages(saved.messages) : []);
    setConversationId(id);
    setConversationTitle(saved?.title ?? '…');
    setHistoryOpen(false);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('You must be signed in.', 401);
      const detail = await fetchConversation({ token, id, limit: 50 });
      writeQueryCache(threadKey, detail);
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
      if (!saved) {
        setError(err instanceof ApiError ? err.message : 'Could not open conversation.');
      }
    } finally {
      setLoadingThread(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setConversationTitle('Kairos');
    setMessages([]);
    setError(null);
    setHistoryOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  useEffect(() => {
    if (scopeId && scopeName) {
      setConversationTitle(scopeName);
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
          ...scopedFilters,
        },
      });

      setConversationId(result.conversationId);
      if (!conversationId) {
        setConversationTitle(query.slice(0, 42));
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
            followUps: suggestions,
          },
        ];
      });
      void refreshProgression();
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
    if (typeof params.q === 'string' && params.q.length > 0 && consumedQuery.current !== params.q) {
      consumedQuery.current = params.q;
      void send(params.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  const confirmDelete = (item: ApiConversationSummary) => {
    Alert.alert('Delete chat?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) return;
            await deleteConversation({ token, id: item.id });
            removeCache(`ask:conversation:${item.id}`);
            if (conversationId === item.id) startNewConversation();
            await refreshList();
          } catch {
            setError('Could not delete.');
          }
        },
      },
    ]);
  };

  const headerTitle = emptyThread ? 'Kairos' : conversationTitle;

  return (
    <TabScreenSwipe>
      <ScreenGradient>
        <FadeInContent>
          <View style={styles.flex}>
            <View style={{ paddingTop: insets.top }}>
              <TopBar
                title={headerTitle}
                leading={{ icon: 'menu', label: 'Chat history', onPress: openHistory }}
                trailing={{ icon: 'edit-3', label: 'New chat', onPress: startNewConversation }}
              />
            </View>

            {
              <View style={styles.scopeRow}>
                <Pressable onPress={() => void openScopePicker()} accessibilityRole="button" accessibilityLabel={`Choose memory scope. Current scope: ${scopeName || 'All memories'}`} style={[styles.scopeChip, { backgroundColor: colors.primaryContainer }]}>
                  <MaterialIcons name="filter-list" size={14} color={colors.text} />
                  <Text style={[styles.scopeLabel, { color: colors.text }]} numberOfLines={1}>
                    {scopeName || 'All memories'}
                  </Text>
                  {scopeName ? <Pressable
                    onPress={() => {
                      setScopeType(null);
                      setScopeId(null);
                      setScopeName(null);
                      setConversationTitle('Kairos');
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear scope"
                  >
                    <MaterialIcons name="close" size={16} color={colors.textMuted} />
                  </Pressable> : null}
                </Pressable>
              </View>
            }

            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={[
                styles.content,
                emptyThread && styles.contentEmpty,
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                if (!emptyThread) scrollToEnd(false);
              }}
            >
              {loadingThread ? <LoadingSkeleton rows={5} /> : null}

              {emptyThread ? (
                <Animated.View entering={FadeIn.duration(280)} style={styles.empty}>
                  <Mascot state="thinking" size={mascotSize.lg} />
                  <Text style={[styles.hero, { color: colors.text }]}>
                    Ask Kairos
                  </Text>
                  <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                    Ask about your memories, patterns, habits, or past.
                  </Text>
                  <View style={styles.starterGrid}>
                    {STARTERS.map((item, index) => (
                      <Animated.View
                        key={item.prompt}
                        entering={itemEntering(index)}
                        style={styles.starterCell}
                      >
                        <PressScale
                          onPress={() => void send(item.prompt)}
                          accessibilityLabel={item.prompt}
                          style={[
                            styles.starterCard,
                            {
                              backgroundColor: colors.surfaceElevated,
                              borderColor: colors.border,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <View style={[styles.starterIconBubble, { backgroundColor: colors.primaryContainer, borderRadius: 999 }]}>
                            <MaterialIcons name={item.icon} size={20} color={colors.primary} />
                          </View>
                          <Text style={[styles.starterText, { color: colors.text }]} numberOfLines={3}>
                            {item.prompt}
                          </Text>
                        </PressScale>
                      </Animated.View>
                    ))}
                  </View>
                  {suggestions.length ? (
                    <View style={styles.followUps}>
                      {suggestions.map((question) => (
                        <PressScale
                          key={question}
                          onPress={() => void send(question)}
                          accessibilityLabel={`Ask: ${question}`}
                          style={[
                            styles.followChip,
                            { borderColor: colors.borderAccent, backgroundColor: colors.primaryContainer },
                          ]}
                        >
                          <Text style={[styles.followText, { color: colors.primary }]}>
                            {question}
                          </Text>
                        </PressScale>
                      ))}
                    </View>
                  ) : null}
                </Animated.View>
              ) : null}

              <View style={styles.thread}>
                {messages.map((message) => (
                  <View key={message.id} style={styles.messageBlock}>
                    {message.role === 'kairos' ? (
                      <View style={styles.assistantHead}>
                        <View style={[styles.mark, { backgroundColor: colors.text }]}>
                          <Text style={[styles.markLetter, { color: colors.inverseText }]}>K</Text>
                        </View>
                        <Text style={[styles.assistantName, { color: colors.text }]}>Kairos</Text>
                      </View>
                    ) : null}
                    <AskBubble message={message} />
                    {message.role === 'kairos' && message.insufficientEvidence ? (
                      <View style={[styles.evidenceNote, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={{ color: colors.textSecondary }}>There is not enough in your memories to answer this confidently.</Text>
                        <View style={styles.evidenceActions}>
                          <Pressable onPress={() => router.push('/(app)/quick-capture')} accessibilityRole="button" accessibilityLabel="Capture more information"><Text style={{ color: colors.text }}>Capture something</Text></Pressable>
                          <Pressable onPress={() => { setScopeType(null); setScopeId(null); setScopeName(null); }} accessibilityRole="button" accessibilityLabel="Broaden memory scope"><Text style={{ color: colors.text }}>Broaden scope</Text></Pressable>
                        </View>
                      </View>
                    ) : null}
                    {message.role === 'kairos' && message.sources && message.sources.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.sources}
                      >
                        {message.sources.map((source, index) => (
                          <Pressable
                            key={`${source.observationId}:${source.chunkId}`}
                            onPress={() =>
                              router.push({
                                pathname: '/(app)/observation/[id]',
                                params: {
                                  id: source.observationId,
                                  chunkId: source.chunkId,
                                  highlight: source.snippet.slice(0, 240),
                                },
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel={`Open citation ${source.title}`}
                            style={[
                              styles.sourceChip,
                              { backgroundColor: colors.primaryContainer },
                            ]}
                          >
                            <Text style={[styles.sourceIndex, { color: colors.textSecondary }]}>
                              {index + 1}
                            </Text>
                            <Text style={[styles.sourceTitle, { color: colors.text }]} numberOfLines={1}>
                              {source.title}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={2}>{source.snippet}</Text>
                            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{source.createdAt ? new Date(source.createdAt).toLocaleDateString() : ''}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}
                    {message.role === 'kairos' && message.followUps && message.followUps.length > 0 ? (
                      <View style={styles.followUps}>
                        {message.followUps.map((q) => (
                          <PressScale
                            key={q}
                            onPress={() => void send(q)}
                            accessibilityLabel={q}
                            style={[
                              styles.followChip,
                              { borderColor: colors.border, backgroundColor: colors.background },
                            ]}
                          >
                            <Text style={[styles.followText, { color: colors.text }]}>{q}</Text>
                          </PressScale>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}

                {typing ? (
                  <View style={styles.typingBlock}>
                    <View style={styles.assistantHead}>
                      <View style={[styles.mark, { backgroundColor: colors.text }]}>
                        <Text style={[styles.markLetter, { color: colors.inverseText }]}>K</Text>
                      </View>
                      <Text style={[styles.assistantName, { color: colors.text }]}>Kairos</Text>
                    </View>
                    <ThinkingDots />
                    <Text style={[styles.typingLabel, { color: colors.textMuted }]}>{statusLabel}</Text>
                  </View>
                ) : null}

                {error ? (
                  <View style={styles.errorBlock}>
                    <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
                    <Pressable
                      onPress={() => {
                        const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                        if (lastUser) void send(lastUser.content);
                      }}
                      hitSlop={8}
                    >
                      <Text style={[styles.retry, { color: colors.text }]}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={[styles.composerDock, { backgroundColor: colors.background }]}>
              <View style={[styles.composer, { backgroundColor: colors.inputFill }]}>
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask anything"
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
                  style={[
                    styles.send,
                    {
                      backgroundColor: canSend ? colors.primary : colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="arrow-upward"
                    size={20}
                    color={canSend ? colors.onPrimary : colors.textDisabled}
                  />
                </Pressable>
              </View>
            </View>

            {keyboardVisible ? (
              <Animated.View style={keyboardSpacerStyle} />
            ) : (
              <View style={{ height: FLOATING_TAB_BAR_CONTENT + Math.max(insets.bottom, 10) }} />
            )}
          </View>
        </FadeInContent>
      </ScreenGradient>

      <Modal
        visible={historyOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryOpen(false)}
      >
        <View style={styles.historyRoot}>
          <View
            style={[
              styles.historyPanel,
              {
                backgroundColor: colors.background,
                paddingTop: insets.top + 8,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <View style={styles.historyHead}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>Chats</Text>
              <Pressable
                onPress={() => setHistoryOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close history"
              >
                <MaterialIcons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <PressScale
              onPress={startNewConversation}
              accessibilityLabel="New chat"
              style={[styles.newChat, { backgroundColor: colors.surfaceElevated }]}
            >
              <MaterialIcons name="edit" size={18} color={colors.text} />
              <Text style={[styles.newChatLabel, { color: colors.text }]}>New chat</Text>
            </PressScale>
            <TextInput value={conversationSearch} onChangeText={setConversationSearch} placeholder="Search chats" placeholderTextColor={colors.textMuted} accessibilityLabel="Search conversations" style={[styles.historySearch, { backgroundColor: colors.surfaceElevated, color: colors.text }]} />
            <SoftRefreshBar active={loadingList && conversations.length > 0} />
            {loadingList && conversations.length === 0 ? (
              <LoadingSkeleton rows={6} />
            ) : (
              <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
                {conversations.length === 0 ? (
                  <Text style={[styles.historyEmpty, { color: colors.textMuted }]}>
                    Your chats will show up here
                  </Text>
                ) : null}
                {conversations.filter((item) => item.title.toLowerCase().includes(conversationSearch.toLowerCase())).map((item) => {
                  const active = item.id === conversationId;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => void openConversation(item.id)}
                      onLongPress={() => confirmDelete(item)}
                      accessibilityLabel={item.title}
                      style={[
                        styles.historyRow,
                        active && { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <MaterialIcons name="chat-bubble-outline" size={18} color={colors.textSecondary} />
                      <View style={styles.flex}>
                        <Text style={[styles.historyRowTitle, { color: colors.text }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.historyRowMeta, { color: colors.textMuted }]}>
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
          <Pressable
            style={[styles.historyScrim, { backgroundColor: colors.scrim }]}
            onPress={() => setHistoryOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss history"
          />
        </View>
      </Modal>
      <Modal visible={scopePickerOpen} transparent animationType="slide" onRequestClose={() => setScopePickerOpen(false)}>
        <View style={styles.historyRoot}>
          <View style={[styles.historyPanel, { backgroundColor: colors.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.historyHead}><Text style={[styles.historyTitle, { color: colors.text }]}>Ask about</Text><Pressable onPress={() => setScopePickerOpen(false)} accessibilityRole="button" accessibilityLabel="Close scope picker"><MaterialIcons name="close" size={22} color={colors.text} /></Pressable></View>
            <Pressable onPress={() => { setScopeType(null); setScopeId(null); setScopeName(null); setScopePickerOpen(false); setConversationId(null); setMessages([]); }} accessibilityRole="button" accessibilityLabel="Ask across all memories" style={styles.historyRow}><Text style={{ color: colors.text }}>All memories</Text></Pressable>
            <ScrollView contentContainerStyle={styles.historyList}>{scopeChoices.map((item) => <Pressable key={`${item.type}:${item.id}`} onPress={() => chooseScope(item.type, item.id, item.name)} accessibilityRole="button" accessibilityLabel={`Ask about ${item.name}`} style={styles.historyRow}><MaterialIcons name={item.type === 'topic' ? 'tag' : item.type === 'project' ? 'folder' : item.type === 'entity' ? 'person' : 'description'} size={18} color={colors.textSecondary} /><Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>{item.name}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.type}</Text></Pressable>)}</ScrollView>
          </View>
          <Pressable style={[styles.historyScrim, { backgroundColor: colors.scrim }]} onPress={() => setScopePickerOpen(false)} accessibilityRole="button" accessibilityLabel="Dismiss scope picker" />
        </View>
      </Modal>
    </TabScreenSwipe>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
    minHeight: 44,
  },
  chromeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chromeTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.41,
  },
  scopeRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scopeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '100%',
  },
  scopeLabel: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 13,
    maxWidth: 220,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    flexGrow: 1,
  },
  contentEmpty: {
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 24,
  },
  intelligenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 4,
  },
  intelligenceBadgeText: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  starterIconBubble: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hero: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.41,
    textAlign: 'center',
    marginBottom: 10,
  },
  starterGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  starterCell: {
    width: '47.6%',
    flexGrow: 1,
  },
  starterCard: {
    minHeight: 112,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    justifyContent: 'space-between',
  },
  starterText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  thread: { gap: 22 },
  messageBlock: { gap: 10 },
  assistantHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 11,
  },
  assistantName: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  sources: {
    gap: 8,
    paddingRight: 8,
  },
  sourceChip: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: 240,
  },
  sourceIndex: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 12,
  },
  sourceTitle: {
    flexShrink: 1,
    fontFamily: 'Roboto_500Medium',
    fontSize: 13,
  },
  followUps: { gap: 8 },
  followChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  followText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 15,
    letterSpacing: -0.24,
  },
  typingBlock: { gap: 10 },
  typingLabel: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 16,
    paddingLeft: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  errorBlock: { gap: 8, paddingVertical: 4 },
  errorText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  retry: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 15,
  },
  composerDock: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 52,
    borderRadius: 26,
  },
  input: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: INPUT_MAX,
    textAlignVertical: 'center',
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  historyRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  historyPanel: {
    width: '82%',
    paddingHorizontal: 16,
    gap: 12,
  },
  historyScrim: {
    flex: 1,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  historyTitle: {
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 28,
    letterSpacing: 0.35,
  },
  newChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  newChatLabel: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 16,
  },
  historyList: {
    gap: 2,
    paddingBottom: 24,
  },
  historySearch: { minHeight: 44, borderRadius: 12, paddingHorizontal: 12, fontFamily: 'Roboto_400Regular', fontSize: 15 },
  evidenceNote: { borderRadius: 12, padding: 12, gap: 10 },
  evidenceActions: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  historyEmpty: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 15,
    paddingVertical: 24,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  historyRowTitle: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  historyRowMeta: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
});
