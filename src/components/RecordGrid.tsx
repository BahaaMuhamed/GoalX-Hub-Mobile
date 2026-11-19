import { useWindowDimensions, View, Text, StyleSheet } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { mediaUrl } from '@/api/platform';
import { rowFields, rowLogo, rowTitle, type ScreenPayload } from '@/workspace/present';
import { colors, spacing } from '@/theme';

type RecordGridProps = {
  data: ScreenPayload;
};

export function RecordGrid({ data }: RecordGridProps) {
  const { width } = useWindowDimensions();
  const columns = width >= 760 ? 2 : 1;

  return (
    <View style={styles.wrap}>
      {data.summary.length ? (
        <View style={styles.summary}>
          {data.summary.map((item) => (
            <View key={item.label} style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.grid}>
        {data.rows.map((row, index) => {
          const logo = mediaUrl(rowLogo(row));
          return (
            <View key={`${rowTitle(row, index)}-${index}`} style={[styles.card, columns === 2 && styles.cardHalf]}>
              <View style={styles.cardHead}>
                {logo ? <BrandMark size={36} uri={logo} /> : null}
                <Text style={styles.cardTitle}>{rowTitle(row, index)}</Text>
              </View>
              {rowFields(row).map((field) => (
                <Text key={field.label} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label} </Text>
                  {field.value}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryItem: {
    minWidth: 108,
    flexGrow: 1,
    backgroundColor: colors.cardRaised,
    borderRadius: 14,
    padding: spacing.md,
    gap: 2,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHalf: {
    width: '48%',
    maxWidth: '48%',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  field: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldLabel: {
    color: colors.faint,
    fontWeight: '600',
  },
});
