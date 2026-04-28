import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useWindowDimensions } from 'react-native';

import { COLORS } from '@/theme/kura-theme';

export interface ChartDataPoint {
  value: number;
  date: Date;
}

interface Range { min: number; max: number }

interface Props {
  dataPoints: ChartDataPoint[];
  unit: string;
  label: string;
  normalRange?: Range;
  alertRange?: Range;
}

const C_GREEN  = '#16A34A';
const C_ORANGE = '#EA580C';
const C_RED    = '#DC2626';

function zoneColor(v: number, nr?: Range, ar?: Range): string {
  if (!nr) return COLORS.primary;
  if (v >= nr.min && v <= nr.max) return C_GREEN;
  if (!ar) return C_ORANGE;
  return (v < ar.min || v > ar.max) ? C_RED : C_ORANGE;
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
}

function fmtDateTime(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(d);
}

function fmt1(v: number): string {
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}

function StatCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.unit}>{unit}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  unit: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

export function ConstantesLineChart({ dataPoints, unit, label, normalRange, alertRange }: Props): React.JSX.Element {
  const { width } = useWindowDimensions();

  if (dataPoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Aucune mesure</Text>
        <Text style={styles.emptySub}>Aucune donnée disponible sur cette période</Text>
      </View>
    );
  }

  const values  = dataPoints.map((p) => p.value);
  const minVal  = Math.min(...values);
  const maxVal  = Math.max(...values);
  const avgVal  = values.reduce((a, b) => a + b, 0) / values.length;
  const lastVal = values[values.length - 1]!;

  // Domain: include range boundaries so zone bands are always visible
  const domainLow  = Math.min(minVal, normalRange?.min ?? minVal, alertRange?.min ?? minVal);
  const domainHigh = Math.max(maxVal, normalRange?.max ?? maxVal, alertRange?.max ?? maxVal);
  const spread     = domainHigh - domainLow;
  const yPad       = Math.max(spread * 0.15, 3);
  const yMin       = Math.max(0, domainLow - yPad);
  const yMax       = domainHigh + yPad;

  // gifted-charts uses yAxisOffset + maxValue to define the Y range
  const chartData = dataPoints.map((pt) => ({
    value: pt.value,
    label: fmtDate(pt.date),
    dataPointColor: zoneColor(pt.value, normalRange, alertRange),
    showStrip: false,
  }));

  // Label sampling: at most 8 labels on X axis
  const labelStep = Math.max(1, Math.ceil(dataPoints.length / 8));
  const chartDataSampled = chartData.map((d, i) => ({
    ...d,
    label: i % labelStep === 0 || i === chartData.length - 1 ? d.label : '',
  }));

  const chartWidth = Math.max(width - 64, dataPoints.length * 36);

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsRow}>
        <StatCard label="Dernière" value={fmt1(lastVal)} unit={unit} color={zoneColor(lastVal, normalRange, alertRange)} />
        <StatCard label="Min"      value={fmt1(minVal)}  unit={unit} color={zoneColor(minVal,  normalRange, alertRange)} />
        <StatCard label="Moyenne"  value={fmt1(avgVal)}  unit={unit} color={zoneColor(avgVal,  normalRange, alertRange)} />
        <StatCard label="Max"      value={fmt1(maxVal)}  unit={unit} color={zoneColor(maxVal,  normalRange, alertRange)} />
      </View>

      {/* Zone legend */}
      {normalRange && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C_GREEN }]} />
            <Text style={styles.legendText}>Normal ({fmt1(normalRange.min)}–{fmt1(normalRange.max)} {unit})</Text>
          </View>
          {alertRange && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDash, { borderColor: C_RED }]} />
              <Text style={styles.legendText}>Seuils d'alerte</Text>
            </View>
          )}
        </View>
      )}

      {/* Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
        <LineChart
          data={chartDataSampled}
          width={chartWidth}
          height={160}
          // Y scale
          yAxisOffset={yMin}
          maxValue={yMax - yMin}
          noOfSections={4}
          // Line
          color={COLORS.primary}
          thickness={2.5}
          curved
          // Dots
          hideDataPoints={false}
          dataPointsRadius={5}
          // Axes
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          xAxisColor="#E2E8F0"
          yAxisColor="#E2E8F0"
          rulesColor="#F1F5F9"
          rulesType="solid"
          // Reference lines for normal zone
          showReferenceLine1={!!normalRange}
          referenceLine1Config={{
            value: normalRange?.max ?? 0,
            labelText: '',
            color: C_GREEN,
            thickness: 1,
            type: 'dashed',
            dashWidth: 4,
            dashGap: 3,
          }}
          showReferenceLine2={!!normalRange}
          referenceLine2Config={{
            value: normalRange?.min ?? 0,
            labelText: '',
            color: C_GREEN,
            thickness: 1,
            type: 'dashed',
            dashWidth: 4,
            dashGap: 3,
          }}
          // Pointer (tap tooltip)
          pointerConfig={{
            pointerStripHeight: 140,
            pointerColor: COLORS.textMuted,
            radius: 6,
            pointerLabelWidth: 130,
            pointerLabelHeight: 64,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: { value?: number; label?: string; dataPointColor?: string }[]) => {
              const item = items[0];
              if (!item) return null;
              const idx = chartDataSampled.findIndex(
                (d) => d.value === item.value,
              );
              const originalPt = dataPoints[idx >= 0 ? idx : 0];
              return (
                <View style={styles.tooltip}>
                  <Text style={[styles.tooltipValue, { color: item.dataPointColor ?? COLORS.primary }]}>
                    {fmt1(item.value ?? 0)} {unit}
                  </Text>
                  {originalPt && (
                    <Text style={styles.tooltipDate}>{fmtDateTime(originalPt.date)}</Text>
                  )}
                </View>
              );
            },
          }}
          animateOnDataChange
        />
      </ScrollView>

      <Text style={styles.chartLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 14,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Chart scroll
  chartScroll: {
    marginHorizontal: -4,
  },

  // Axes
  axisText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },

  // Tooltip
  tooltip: {
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    minWidth: 110,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tooltipValue: {
    fontWeight: '800',
    fontSize: 15,
  },
  tooltipDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Bottom label
  chartLabel: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
