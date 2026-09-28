import { useAuth } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import { addObservationsToProjectBulk, deleteObservation, fetchEntities, fetchObservationsPage, fetchProjects, fetchTopics, reprocessObservation, semanticSearch, type ApiEntitySummary, type ApiObservation, type ApiProjectSummary, type ApiSemanticSearchResult, type ApiTopicSummary, type CaptureSource } from '../../../lib/api';
import { buildSemanticFilters, dateRangeForPreset, removeLibraryFilter, toggleLibraryScopeFilter, SEARCH_DATE_OPTIONS, SEARCH_SOURCE_OPTIONS, type LibraryFilters } from '../../../lib/searchFilters';
import { useAppTheme } from '../../../providers/ThemeProvider';

type ViewKind = 'Timeline' | 'Topics' | 'People & Things' | 'Projects';
const VIEWS: ViewKind[] = ['Timeline', 'Topics', 'People & Things', 'Projects'];
const TYPES = ['DOCUMENT', 'PDF', 'IMAGE', 'TEXT', 'AUDIO'] as const;
const ENTITY_ICONS: Record<ApiEntitySummary['type'], keyof typeof MaterialIcons.glyphMap> = {
  PERSON: 'person', ORGANIZATION: 'business', TECHNOLOGY: 'memory',
  PRODUCT: 'inventory-2', LOCATION: 'place', CONCEPT: 'lightbulb-outline',
};

export default function LibraryScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewKind>('Timeline');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<LibraryFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterChoices, setFilterChoices] = useState<Array<{ id: string; name: string; type: 'topic' | 'entity' | 'project' }>>([]);
  const [searchResults, setSearchResults] = useState<ApiSemanticSearchResult[] | null>(null);
  const [items, setItems] = useState<ApiObservation[]>([]);
  const [topics, setTopics] = useState<ApiTopicSummary[]>([]);
  const [entities, setEntities] = useState<ApiEntitySummary[]>([]);
  const [projects, setProjects] = useState<ApiProjectSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [projectPicker, setProjectPicker] = useState(false);

  const load = useCallback(async (append = false) => {
    setBusy(true); setError(false);
    try {
      const token = await getToken(); if (!token) return;
      if (view === 'Timeline') {
        const { observationType, ...queryFilters } = filters;
        const page = await fetchObservationsPage(token, { ...queryFilters, limit: 20, ...(append && cursor ? { cursor } : {}) });
        const pageItems = observationType ? page.items.filter((item) => item.type === observationType) : page.items;
        setItems((old) => append ? [...old, ...pageItems] : pageItems); setCursor(page.nextCursor);
      } else if (view === 'Topics') setTopics((await fetchTopics({ token, limit: 40 })).items);
      else if (view === 'People & Things') setEntities((await fetchEntities({ token, limit: 80 })).items);
      else setProjects((await fetchProjects({ token, limit: 40 })).items);
    } catch { setError(true); } finally { setBusy(false); }
  }, [getToken, view, filters, cursor]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    void getToken().then(async (token) => {
      if (!token) return;
      try { setProjects((await fetchProjects({ token, limit: 40 })).items); } catch { /* The project list is optional until needed. */ }
    });
  }, [getToken]);
  const runSearch = async () => {
    if (!query.trim()) { setSearchResults(null); return; }
    try { const token = await getToken(); if (!token) return; const result = await semanticSearch({ token, query: query.trim(), filters: buildSemanticFilters(filters) }); setSearchResults(result.results); }
    catch { setError(true); }
  };
  const askCurrent = () => router.push({ pathname: '/(app)/(tabs)/ask', params: { scopeType: 'filters', scopeName: 'Current filters', filterScope: JSON.stringify(buildSemanticFilters(filters)) } });
  const toggleScopeFilter = (choice: { id: string; name: string; type: 'topic' | 'entity' | 'project' }) => setFilters((old) => toggleLibraryScopeFilter(old, choice));
  const openFilters = async () => {
    setFilterOpen(true);
    try {
      const token = await getToken(); if (!token) return;
      const [topicRows, entityRows, projectRows] = await Promise.all([
        fetchTopics({ token, limit: 40 }), fetchEntities({ token, limit: 80 }), fetchProjects({ token, limit: 40 }),
      ]);
      setFilterChoices([
        ...topicRows.items.map((item) => ({ id: item.id, name: item.name, type: 'topic' as const })),
        ...entityRows.items.map((item) => ({ id: item.id, name: item.name, type: 'entity' as const })),
        ...projectRows.items.map((item) => ({ id: item.id, name: item.name, type: 'project' as const })),
      ]);
      setProjects(projectRows.items);
    } catch { setFilterChoices([]); }
  };
  const toggle = (id: string) => setSelected((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  const bulkDelete = () => Alert.alert('Delete memories?', `Delete ${selected.length} selected memories?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { const token = await getToken(); if (!token) return; await Promise.all(selected.map((id) => deleteObservation(token, id))); setSelected([]); void load(); } catch { setError(true); } } },
  ]);
  const bulkReprocess = async () => { try { const token = await getToken(); if (!token) return; await Promise.all(selected.map((id) => reprocessObservation(token, id))); setSelected([]); void load(); } catch { setError(true); } };
  const addToProject = async (projectId: string) => { try { const token = await getToken(); if (!token) return; await addObservationsToProjectBulk({ token, projectId, observationIds: selected }); setSelected([]); setProjectPicker(false); } catch { Alert.alert('Could not add memories', 'Please try again.'); } };

  const memoryRow = (item: ApiObservation | ApiSemanticSearchResult) => {
    const isSearch = 'chunkId' in item;
    const id = isSearch ? item.observationId : item.id;
    const title = isSearch ? item.observation.filename : item.filename;
    return <Pressable key={`${id}-${isSearch ? item.chunkId : ''}`} onPress={() => selected.length ? toggle(id) : router.push({ pathname: '/(app)/observation/[id]', params: { id, ...(isSearch ? { chunkId: item.chunkId, snippet: item.content } : {}) } })} onLongPress={() => toggle(id)} accessibilityRole="button" accessibilityLabel={`${selected.includes(id) ? 'Deselect' : 'Open'} ${title}`} style={[styles.row, { backgroundColor: colors.surfaceElevated }]}>
      {selected.length > 0 ? <MaterialIcons name={selected.includes(id) ? 'check-circle' : 'radio-button-unchecked'} size={21} color={colors.text} /> : null}
      <View style={{ flex: 1 }}><ThemedText colorKey="text" style={styles.rowTitle} numberOfLines={1}>{title}</ThemedText><ThemedText colorKey="textSecondary" numberOfLines={2}>{isSearch ? item.content : item.summary || item.sourceLabel || item.status}</ThemedText></View>
      {!isSearch ? <ThemedText colorKey="textMuted">{item.type}</ThemedText> : null}
    </Pressable>;
  };

  return <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
    <View style={[styles.search, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <MaterialIcons name="search" size={22} color={colors.textSecondary} />
      <TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => void runSearch()} placeholder="Search your memories" placeholderTextColor={colors.textMuted} returnKeyType="search" style={[styles.input, { color: colors.text }]} accessibilityLabel="Search your memories" />
      <Pressable onPress={() => void openFilters()} accessibilityRole="button" accessibilityLabel="Open search filters"><MaterialIcons name="tune" size={22} color={colors.text} /></Pressable>
    </View>
    {Object.entries(filters).filter(([key]) => key !== 'to' && !(key === 'topic' && filters.topicId) && !(key === 'entity' && filters.entityId)).map(([key, value]) => value ? <Pressable key={key} onPress={() => setFilters((old) => removeLibraryFilter(old, key as keyof LibraryFilters))} accessibilityRole="button" accessibilityLabel={`Remove ${key} filter`} style={[styles.filterChip, { borderColor: colors.border }]}><ThemedText colorKey="textSecondary">{key === 'source' ? SEARCH_SOURCE_OPTIONS.find((source) => source.value === value)?.label || value : key === 'from' && filters.to ? 'Custom date range' : filterChoices.find((item) => item.id === value)?.name || value}</ThemedText><MaterialIcons name="close" size={14} color={colors.textSecondary} /></Pressable> : null)}
    <View style={styles.segments}>{VIEWS.map((label) => <Pressable key={label} onPress={() => { setView(label); setSearchResults(null); setSelected([]); }} accessibilityRole="tab" accessibilityState={{ selected: view === label }} accessibilityLabel={label} style={[styles.segment, view === label && { backgroundColor: colors.text }]}><ThemedText colorKey={view === label ? 'background' : 'textSecondary'} style={styles.segmentText}>{label}</ThemedText></Pressable>)}</View>
    {view === 'Timeline' || searchResults ? <Pressable onPress={askCurrent} accessibilityRole="button" accessibilityLabel="Ask about current search and filters" style={[styles.ask, { backgroundColor: colors.surfaceElevated }]}><ThemedText colorKey="text">Ask about this</ThemedText><MaterialIcons name="arrow-forward" size={18} color={colors.text} /></Pressable> : null}
    {selected.length ? <View style={[styles.actions, { backgroundColor: colors.surfaceElevated }]}><ThemedText colorKey="text">{selected.length} selected</ThemedText><Pressable onPress={() => setProjectPicker(true)} accessibilityRole="button" accessibilityLabel="Add selected memories to a project"><ThemedText colorKey="text">Project</ThemedText></Pressable><Pressable onPress={() => void bulkReprocess()} accessibilityRole="button" accessibilityLabel="Reprocess selected memories"><ThemedText colorKey="text">Reprocess</ThemedText></Pressable><Pressable onPress={bulkDelete} accessibilityRole="button" accessibilityLabel="Delete selected memories"><ThemedText colorKey="error">Delete</ThemedText></Pressable></View> : null}
    {error ? <ErrorState title="Library unavailable" onRetry={() => void load()} /> : busy && items.length === 0 && view === 'Timeline' ? <LoadingSkeleton rows={6} /> : view === 'Timeline' ? <FlatList<ApiObservation | ApiSemanticSearchResult> data={searchResults ?? items} keyExtractor={(item, index) => 'chunkId' in item ? `${item.chunkId}-${index}` : item.id} renderItem={({ item }) => memoryRow(item)} contentContainerStyle={{ paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 24 }} onEndReached={() => { if (!searchResults && cursor) void load(true); }} onEndReachedThreshold={0.6} ListEmptyComponent={<ThemedText colorKey="textMuted" style={styles.empty}>No matching memories.</ThemedText>} /> : <FlatList<ApiTopicSummary | ApiProjectSummary | ApiEntitySummary> data={view === 'Topics' ? topics : view === 'Projects' ? projects : [...entities].sort((a, b) => a.type.localeCompare(b.type))} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 24 }} renderItem={({ item }) => {
      const title = item.name; const meta = 'observationCount' in item ? `${item.observationCount} memories` : '';
      const route = view === 'Topics' ? `/(app)/topics/${item.id}` : view === 'Projects' ? `/(app)/projects/${item.id}` : `/(app)/entities/${item.id}`;
      const scopeType = view === 'Topics' ? 'topic' : view === 'Projects' ? 'project' : 'entity';
      return <View style={[styles.row, { backgroundColor: colors.surfaceElevated }]}>{'type' in item && view === 'People & Things' ? <MaterialIcons name={ENTITY_ICONS[item.type]} size={22} color={colors.textSecondary} /> : null}<Pressable onPress={() => router.push(route as never)} accessibilityRole="button" accessibilityLabel={`Open ${title}`} style={{ flex: 1 }}><ThemedText colorKey="text" style={styles.rowTitle}>{title}</ThemedText><ThemedText colorKey="textSecondary">{meta}{'type' in item ? ` · ${item.type.toLowerCase()}` : ''}</ThemedText></Pressable><Pressable onPress={() => router.push({ pathname: '/(app)/(tabs)/ask', params: { scopeType, scopeId: item.id, scopeName: title } })} accessibilityRole="button" accessibilityLabel={`Ask about ${title}`} style={styles.askIcon}><MaterialIcons name="chat-bubble-outline" size={20} color={colors.text} /></Pressable></View>;
    }} />}
    <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}><Pressable onPress={(event) => { if (event.target === event.currentTarget) setFilterOpen(false); }} style={[styles.scrim, { backgroundColor: colors.scrim }]}><View style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}><ThemedText colorKey="text" style={styles.sheetTitle}>Filters</ThemedText><ThemedText colorKey="textSecondary">Type</ThemedText><View style={styles.wrap}>{TYPES.map((type) => <Pressable key={type} onPress={() => setFilters((old) => ({ ...old, observationType: old.observationType === type ? undefined : type }))} accessibilityRole="button" accessibilityLabel={`Filter by ${type}`} style={[styles.filterChip, { borderColor: colors.border }]}><ThemedText colorKey="text">{type}</ThemedText></Pressable>)}</View><ThemedText colorKey="textSecondary">Source</ThemedText><View style={styles.wrap}>{SEARCH_SOURCE_OPTIONS.map((source) => <Pressable key={source.value} onPress={() => setFilters((old) => ({ ...old, source: old.source === source.value ? undefined : source.value as CaptureSource }))} accessibilityRole="button" accessibilityLabel={`Filter by ${source.label}`} style={[styles.filterChip, { borderColor: colors.border }]}><ThemedText colorKey="text">{source.label}</ThemedText></Pressable>)}</View><ThemedText colorKey="textSecondary">Date</ThemedText><View style={styles.wrap}>{SEARCH_DATE_OPTIONS.map((option) => <Pressable key={option.value} onPress={() => setFilters((old) => ({ ...old, ...dateRangeForPreset(option.value) }))} accessibilityRole="button" accessibilityLabel={`Filter by ${option.label}`} style={[styles.filterChip, { borderColor: colors.border }]}><ThemedText colorKey="text">{option.label}</ThemedText></Pressable>)}</View><TextInput value={filters.from ?? ''} onChangeText={(from) => setFilters((old) => ({ ...old, from }))} placeholder="From date (ISO)" placeholderTextColor={colors.textMuted} accessibilityLabel="Custom date range start" style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><TextInput value={filters.to ?? ''} onChangeText={(to) => setFilters((old) => ({ ...old, to }))} placeholder="To date (ISO)" placeholderTextColor={colors.textMuted} accessibilityLabel="Custom date range end" style={[styles.input, { color: colors.text, borderColor: colors.border }]} />{(['topic', 'entity', 'project'] as const).map((kind) => <View key={kind}><ThemedText colorKey="textSecondary" style={styles.filterHeading}>{kind[0].toUpperCase() + kind.slice(1)}</ThemedText><View style={styles.wrap}>{filterChoices.filter((choice) => choice.type === kind).map((choice) => <Pressable key={choice.id} onPress={() => toggleScopeFilter(choice)} accessibilityRole="button" accessibilityLabel={`Filter by ${kind} ${choice.name}`} style={[styles.filterChip, { borderColor: colors.border }]}><ThemedText colorKey="text">{choice.name}</ThemedText></Pressable>)}</View></View>)}<Pressable onPress={() => { setFilters({}); setFilterOpen(false); }} accessibilityRole="button" accessibilityLabel="Clear all filters"><ThemedText colorKey="textSecondary" style={styles.done}>Clear filters</ThemedText></Pressable><Pressable onPress={() => { setFilterOpen(false); void load(); }} accessibilityRole="button" accessibilityLabel="Apply filters"><ThemedText colorKey="text" style={styles.done}>Done</ThemedText></Pressable></View></Pressable></Modal>
    <Modal visible={projectPicker} transparent animationType="slide" onRequestClose={() => setProjectPicker(false)}><Pressable style={[styles.scrim, { backgroundColor: colors.scrim }]} onPress={() => setProjectPicker(false)}><View style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]}><ThemedText colorKey="text" style={styles.sheetTitle}>Add to project</ThemedText>{projects.map((project) => <Pressable key={project.id} onPress={() => void addToProject(project.id)} accessibilityRole="button" accessibilityLabel={`Add selected memories to ${project.name}`} style={styles.projectOption}><ThemedText colorKey="text">{project.name}</ThemedText></Pressable>)}</View></Pressable></Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 10 }, search: { marginHorizontal: 14, minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 }, filterChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 5, marginTop: 6, marginLeft: 8 }, segments: { flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 12 }, segment: { flex: 1, minHeight: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }, segmentText: { fontFamily: 'Inter_500Medium', fontSize: 11 }, ask: { marginHorizontal: 14, marginBottom: 7, borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between' }, actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 }, row: { marginHorizontal: 12, marginVertical: 4, minHeight: 60, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, rowTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 }, askIcon: { padding: 8 }, empty: { textAlign: 'center', padding: 28 }, scrim: { flex: 1, justifyContent: 'flex-end' }, sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 34, gap: 8, maxHeight: '85%' }, sheetTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 21 }, wrap: { flexDirection: 'row', flexWrap: 'wrap' }, done: { textAlign: 'center', padding: 10 }, projectOption: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#888' }, filterHeading: { marginTop: 8, textTransform: 'capitalize' },
});
