import { Pressable, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import type { WorldGraphNode } from '../../lib/homeSummary';
import { ice } from '../../theme';
import { KairosText } from '../ui/Kairos';

export function HomeWorld({
  nodes,
  edges,
  width,
  emptyCopy,
  onPressNode,
}: {
  nodes: WorldGraphNode[];
  edges: Array<{ from: string; to: string }>;
  width: number;
  emptyCopy: string;
  onPressNode: (href: string) => void;
}) {
  const height = 200;
  const inner = Math.max(200, (width || 320) - 40);

  if (nodes.length === 0) {
    return (
      <View style={{ minHeight: 120, justifyContent: 'center' }}>
        <KairosText variant="caption" color="textSecondary">
          {emptyCopy}
        </KairosText>
      </View>
    );
  }

  return (
    <View>
      <Svg width={inner} height={height}>
        {edges.map((edge) => {
          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);
          if (!from || !to) return null;
          const x1 = from.x * inner;
          const y1 = from.y * height;
          const x2 = to.x * inner;
          const y2 = to.y * height;
          if (![x1, y1, x2, y2].every((value) => Number.isFinite(value))) return null;
          return (
            <Line
              key={`${edge.from}-${edge.to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={to.y * height}
              stroke={ice}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          );
        })}
        {nodes.map((node) => {
          const cx = node.x * inner;
          const cy = node.y * height;
          if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
          return (
            <Circle
              key={node.id}
              cx={cx}
              cy={cy}
              r={8}
              fill="#F5F5F5"
            />
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {nodes
          .filter((node) => node.href)
          .map((node) => (
            <Pressable
              key={node.id}
              onPress={() => onPressNode(node.href)}
              accessibilityRole="button"
              accessibilityLabel={node.name}
              hitSlop={8}
            >
              <KairosText variant="caption" color="accent">
                {node.name}
              </KairosText>
            </Pressable>
          ))}
      </View>
    </View>
  );
}
